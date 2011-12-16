(ns clgam.long-poll
  (:use aleph.core lamina.core aleph.http)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use ring.middleware.file-info)
  (:use ring.middleware.content-type)
  (:use ring.middleware.params)
  (:use ring.middleware.session)
  (:require [ring.util.response :as r])
  (:use  [clojure.contrib.str-utils :only [str-join]])
  (:require  [clgam.core :as c])
  (:require [clojure.contrib.json :as j])
  )

(def igraci #{"kristina","ruzica","dusan","pera","mika","laza"})

(def symbol-db {"tictactoe" {"W" "img/o.jpg", "B" "img/x.jpg"} })


(comment ovo ce kao deo specifikacije igre da bude u mongo definiciji)

(defn empty-response
  "Koristim za AJAX pozive gde nije bitan response, nego se response dobija
pomocu long-pollinga ili websocketa"
  [] {:status 200
      :headers {"content-type" "text/plain"}
      :body ""})

(defn json-response[output]
  {:status 200
   :headers {"content-type" "text/plain"}
   :body (j/json-str output)}
  )

(comment Kasnije ce da se naravno napravi pravi login modul)



(defmacro with-session [request & body]
  `(let [session# (:session ~request)]
     (when (and session# (:username session#))
       (do ~@body))))

(defmacro defs [fname [request & rest] & body]
  `(defn ~fname [~request ~@rest]
     (with-session ~request ~@body)))

(defs start-new-game
  [request game_name]
  (if-let [game-uid (c/postavi_igru game_name (:username (:session request)))]
    (-> (json-response {:guid game-uid :game game_name}) (assoc :session (merge (:session request) {:guid game-uid :game game_name})))
    (empty-response)))

(defn start-game-handler [{params :params :as request}]
  (start-new-game request (params "game_name"))
  )

(defs join_game [request game_name game]
  (if
      (c/join_game (symbol game) (:username (:session request)))
    (-> (empty-response) (assoc :session (merge (:session request) {:guid game :game game_name})))
    (empty-response)))

(defn join-game-handler [{params :params :as request}]
  (join_game request (params "game_name") (params "game_uid")))

(defn get-game-definition 
  "za sada ce da vraca samo tabelu simbola, kasnije treba da se doda sve ostalo"
  [{params :params :as request}]
  (json-response (symbol-db (params "game_name"))))
  

(def coords_inq (channel))
(receive-all coords_inq (fn[_]))

(defs play [request]
  (let [username (:username (:session request))
        gm (c/user_game username)
        guid (gm 0)
        params (:params request)
        [x y] (map #(Double/parseDouble %) [(params "xcoord") (params "ycoord")])
        game (gm 1)
        board_fields (merge (c/transfer-board-koords x y game) {:picsym (:figura (@c/igraci username)) , :guid guid , :game_name game} )
        ]
    "kada imam samo jednu figuru po igracu, figure ce da se uzimaju iz difolta, inace ce iz js-a.
necu sada da ulazim udetalje, ovo ce da se izmeni kada budem radio sah"
    (when-let [partija (c/play-game guid username board_fields )]
      (do
	(println "Usao sam ovde")
	(enqueue coords_inq board_fields)
	)
      )
    (empty-response)))


    
(def ulazniq (channel))

(defn longpoll-general
  "boilerplate with the channel, queueue and the transformer function"
  [ch q f]
  (when(not (or (closed? ch) (closed? q)))
    (receive-all (fork q)
	     (fn[x]
	       (when-let [f-rez (f x)]
		 (enqueue ch {:status 200, :headers {"content-type" "text/plain"}, :body f-rez}))))))

(defn longpoll 
  "common function for all long poll requests"
  [ch q]
  (longpoll-general ch q identity))

(defn pending-invitations [username]
  (let [kanal (:kanal (@c/igraci username))]
    (longpoll-general kanal (:game-list-channel @c/soba)
		      (fn[x]
			"funkcija body"
			(let [game-invitations (c/get-game-invitations :soba :igra)]
			  (j/json-str {:invitations game-invitations})))
		      )))

(defn game-message-broadcast [username]
  (let [kanal (:kanal (@c/igraci username)),
        game-id (:plays (@c/igraci username))
        game-channel (@c/kanali game-id)
        ]
    (when game-channel
      (longpoll-general kanal game-channel
			(fn [x]
			  (if-let [player (and (:invalid_move x) (:player x))]
			    (when (= username player)
			      (j/json-str {:game-uid game-id ,:invalid_move x}))
			    (j/json-str {:game-uid game-id , :event x})))))))
      

(defn get-game-session
  "ovo se zove iz javascripta kada se stranica ucitava ili refresuje da se dobiju podaci iz sesije, username, igra koju trenutno igra igrac, koje igre posmatra, itd."
  [ch request]
  )

(defn tictactoehandler-out [username]
  (let [kanal (:kanal (@c/igraci username)),
        game-id (:plays (@c/igraci username))
        filter (fn[x]
                 (println (str "Kao da nesto nije u redu" x))
		 (when (= game-id (:guid x)) (j/json-str {:guid game-id, :fieldsout x})))]
    (longpoll-general kanal coords_inq filter)))

(defn login [username site session]
  "za sada cu da zanemarim sajt, ali kasnije ce da se svako loguje na svoj"
  (when (contains?  igraci username)
    (do
      (println "Usao u login")
      (c/dodeli-kanal username)
      (tictactoehandler-out username)
      (game-message-broadcast username)
      (pending-invitations username)
      (assoc session :username username)
      )
    ))
(defn login-handler [{params :params , session :session}]
  (if-let [sess(login (params "username") :firstsite session)]
    (-> (r/redirect
	 "/testajax.html") (assoc :session sess))
    (r/redirect "/login.html?err=loginfailed")))

(defn all-longpoll-out
  "There is limitation in Internet explorer- 2 request at the same time. That means we have to
keep just one longpolling request open, and all the messages should come back through the conforming channel. Client will distinguish the messages based on the key of the JSON object.
Additonaly, in order not to lose  messages, each player will have one lamina channel when logged in. All the messages will be read from that channel"
  [ch request]
  (let [params (:params request), sess (:session request),
        username (:username sess),
        user-channel (:kanal (@c/igraci username))]
      (println params)
    (if user-channel
      (siphon user-channel ch)
      (println "User channel je nil!~"))))
  
(defn fillq [{params :params}]
  (let [val (params "val")]
     (enqueue ulazniq val)
    )
    (empty-response)
  )

(receive-all ulazniq (fn[x] (println "praznim" x)))

(defn long-poll-handler [ch request]
  (longpoll ch ulazniq)
  )


(def ruter (app
            (wrap-file-info)
            (wrap-file "src/webstatic")
            (wrap-content-type)
	    (wrap-session)
            ["queuein"] (wrap-params fillq)
	    ["tictactoe"] (wrap-params play)
	    ["login"] (wrap-params login-handler)
            ["startgame"] (wrap-params start-game-handler)
            ["joingame"] (wrap-params join-game-handler)
	    ["gamedef"] (wrap-params get-game-definition)
	    ["longpoll"](wrap-params (wrap-aleph-handler all-longpoll-out))
            ))

(defonce stop (start-http-server (wrap-ring-handler #'ruter) {:port 8080}))
