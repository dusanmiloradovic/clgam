
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

(defn login [username site session]
  "za sada cu da zanemarim sajt, ali kasnije ce da se svako loguje na svoj"
  (when (contains?  igraci username)
    (assoc session :username username)
    ))

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
        board_fields (merge (c/transfer-board-koords x y game) {:picsym ((@c/igraci username) 0) , :guid guid , :game_name game} )
        ]
    "kada imam samo jednu figuru po igracu, figure ce da se uzimaju iz difolta, inace ce iz js-a.
necu sada da ulazim udetalje, ovo ce da se izmeni kada budem radio sah"
    (when-let [partija (c/play-game guid username board_fields )]
      (enqueue coords_inq board_fields)
      )
    (empty-response)))

(defn login-handler [{params :params , session :session}]
  (if-let [sess(login (params "username") :firstsite session)]
    (-> (r/redirect
	 "/testajax.html") (assoc :session sess))
    (r/redirect "/login.html?err=loginfailed")))
    
(def ulazniq (channel))

(defn longpoll-general
  "boilerplate with the channel, queueue and the transformer function"
  [ch q f]
  (when(not (or (closed? ch) (closed? q)))
    (receive (fork q)
	     (fn[x]
	       (when-let [f-rez (f x)]
		 (enqueue ch {:status 200, :headers {"content-type" "text/plain"}, :body f-rez}))))))

(defn longpoll 
  "common function for all long poll requests"
  [ch q]
  (longpoll-general ch q identity))

(defn pending-invitations
  "read pending game invitations. queue is just a trigger"
  [ch request]
  "ideja je da ako je neka igra pocela, a ja sam je startovao (ili se pridruzrio pre nego sto je pocela
za igre sa >=3 igraca da mi se u sesiju upise ime igre i guid da bih mogao da nastavim"
  (let [username (:username (:session request))
	sess (:session request)]
    (longpoll-general ch (:game-list-channel @c/soba)
		      (fn[x]
			"funkcija body"
			(let [game-invitations (c/get-game-invitations :soba :igra)]
			  (j/json-str {:invitations game-invitations})))
		      )))


(defn game-message-broadcast
  "channels events and validations message to all the players and observers of the game"
  [ch request]
  "za sada cu staviti samo igru koju igram da posmatram, ali ce uskoro biti moguce da
se igre i posmatraju, i za te korisnike treba da se salju poruke"
  (let [username (:username (:session request))]
    
  )
  )

(defn get-game-session
  "ovo se zove iz javascripta kada se stranica ucitava ili refresuje da se dobiju podaci iz sesije, username, igra koju trenutno igra igrac, koje igre posmatra, itd."
  [ch request]
  )


(defn tictactoehandler_out [ch request]
  (let [params (:params request) , guid (symbol (params "game_uid") ),
	filter (fn[x]
		 (when (= guid (:guid x)) (j/json-str {:fieldsout x})))]
    (longpoll-general ch coords_inq filter)))

(defn all-longpoll-out
  "There is limitation in Internet explorer- 2 request at the same time. That means we have to
keep just one longpolling request open, and all the messages should come back through the conforming channel. Client will distinguish the messages based on the key of the JSON object."
  [ch request]
  (do
    (tictactoehandler_out ch request)
    (game-message-broadcast ch request)
    (pending-invitations ch request)
    ))

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
            ["poll"]
            (wrap-params (wrap-aleph-handler long-poll-handler))
	    ["tictactoe"] (wrap-params play)
	    ["fieldsout"] (wrap-params (wrap-aleph-handler tictactoehandler_out))
	    ["login"] (wrap-params login-handler)
            ["pending"] (wrap-aleph-handler pending-invitations)
            ["startgame"] (wrap-params start-game-handler)
            ["joingame"] (wrap-params join-game-handler)
	    ["gamedef"] (wrap-params get-game-definition)
	    ["longpoll"](wrap-aleph-handler all-longpoll-out)
            ))

(defonce stop (start-http-server (wrap-ring-handler #'ruter) {:port 8080}))
