
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
(defn empty-response
  "Koristim za AJAX pozive gde nije bitan response, nego se response dobija
pomocu long-pollinga ili websocketa"
  [] {:status 200
      :headers {"content-type" "text/plain"}
      :body ""})
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
      (c/postavi_igru game_name (:username (:session request)))
      (empty-response))

(defn start-game-handler [{params :params :as request}]
  (start-new-game request (params "game_name"))
  )

 
(defs join_game [request game_name game]
  (c/join_game (symbol game) (:username (:session request)))
  (empty-response))

(defn join-game-handler [{params :params :as request}]
  (join_game request (params "game_name") (params "game_uid")))

(def coords_inq (channel))
(receive-all coords_inq (fn[_]))

(defs play [request]
  (let [username (:username (:session request))
        guid (:guid (:session request))
        params (:params request)
        [x y] (map #(Double/parseDouble %) [(params "xcoord") (params "ycoord")])
        game (:game (:session request))
        board_fields (c/transfer-board-koords x y game)
        flds [:xfield board_fields, :yfield board_fields]
        ]
    (when-let [partija (c/play-game guid username flds )]
      (enqueue coords_inq (j/json-str flds)))))

(defn login-handler [{params :params , session :session}]
  (if-let [sess(login (params "username") :firstsite session)]
    (-> (r/redirect
	 "/testajax.html") (assoc :session sess))
    (r/redirect "/login.html?err=loginfailed")))
    
(def ulazniq (channel))


(defn tictactoehandler_in [{params :params}]
  (let [[x y] (map #(Double/parseDouble %) [(params "xcoord") (params "ycoord")])]
    (enqueue coords_inq (j/json-str (c/transfer-board-koords x y "tictactoe")))
    (empty-response)
    ))

(defn longpoll-general
  "boilerplate with the channel, queueue and the transformer function"
  [ch q f]
  (when(not (or (closed? ch) (closed? q)))
    (receive (fork q)
	     (fn[x]
	       (enqueue ch
			{:status 200, :headers {"content-type" "text/plain"}, :body (f x)})))))


(defn longpoll 
  "common function for all long poll requests"
  [ch q]
  (longpoll-general ch q identity))

(defn pending-invitations
  "read pending game invitations. queue is just a trigger"
  [ch request]
  (longpoll-general ch (:game-list-channel @c/soba)
		    (fn[x] 
		      (let [game-invitations (c/get-game-invitations :soba :igra)]
			(j/json-str game-invitations)))))


(defn tictactoehandler_out [ch request]
  (longpoll ch coords_inq))

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
	    ["tictactoe"] (wrap-params tictactoehandler_in)
	    ["fieldsout"] (wrap-aleph-handler tictactoehandler_out)
	    ["login"] (wrap-params login-handler)
            ["pending"] (wrap-aleph-handler pending-invitations)
            ["startgame"] (wrap-params start-game-handler)
            ["joingame"] (wrap-params join-game-handler)
            ))

(defonce stop (start-http-server (wrap-ring-handler #'ruter) {:port 8080}))
