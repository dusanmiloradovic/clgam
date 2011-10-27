(ns clgam.web
  (:use ring.adapter.jetty)
  (:use net.cgrand.enlive-html)
  (:use net.cgrand.moustache [:only app]))



(defn handler [req]
  {:status  200
   :headers {"Content-Type" "text/html"}
   :body    "Hello World from Ring"})

(defn boot []
  (run-jetty #'handler {:port 8080}))

(comment
(defonce server (run-jetty #'handler {:port 8080 :join false}))
)