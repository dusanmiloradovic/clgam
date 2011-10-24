(ns clgam.web
  (:use ring.adapter.jetty))

(defn handler [req]
  {:status  200
   :headers {"Content-Type" "text/html"}
   :body    "Hello World from Ring"})

(defn boot []
  (run-jetty #'handler {:port 8080}))

(defonce server (run-jetty #'handler {:port 8080}))
