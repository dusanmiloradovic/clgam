
(ns clgam.long-poll
  (:use aleph.core lamina.core aleph.http)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use ring.middleware.file-info)
  (:use ring.middleware.content-type)
  (:use ring.middleware.params)
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
  (if (contains? username igraci)
    (assoc session username)
    ))

(defmacro with-session [request body]
  `(let [session# (:session ~request)]
     (if (and session# (:username session#))
       ~body)))
(defn start_new_game [request game_name]
  "za sada imam samo iksoks tako da
ovo treba da zove samo to"
  (with-session request
    (
     (c/postavi_igru game_name (:username (:session request)))
     (empty-response)
     )
  ))



(defn join_game [request game_name game])

(defn play [request game]
  "procitace koordinate iz requesta"
  )


(defn login_handler [{params :params , session :session}]
  (if-let [session (login (params "username") :firstsite session)]
    {:status 200
     :headers {"Content-Type" "text/html"}
     :session session
     :body (params "useranme")
     }
    {:status 200
     :headers {"Content-Type" "text/html"}
     :body "Login failed"
     }))
    
    
(def ulazniq (channel))

(def coords_inq (channel))
(receive-all coords_inq (fn[_]))

(defn tictactoehandler_in [{params :params}]
  (let [[x y] (map #(Double/parseDouble %) [(params "xcoord") (params "ycoord")])]
    (enqueue coords_inq (j/json-str (c/transfer-board-koords x y "tictactoe")))
    (empty-response)
    ))


(defn longpoll [ch q]
  "common function for all long poll requests"
  (when (not (closed? ch))
     (receive (fork q)
	      (fn[x]
		(enqueue ch
			 {:status 200, :headers {"content-type" "text/plain"}, :body x})))))

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
            ["queuein"] (wrap-params fillq)
            ["poll"]
            (wrap-params (wrap-aleph-handler long-poll-handler))
	    ["tictactoe"] (wrap-params tictactoehandler_in)
	    ["fieldsout"] (wrap-aleph-handler tictactoehandler_out)
            ))

(def stop (start-http-server (wrap-ring-handler ruter) {:port 8080}))