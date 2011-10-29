(ns clgam.web
  (:use ring.adapter.jetty)
  (:use net.cgrand.enlive-html)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  )
(comment	    (wrap-file "src/webstatic"))

(def ruter (app
(wrap-file "src/webstatic")
            ["nosa"]
(fn[req] 
  {:status 200 :headers {"Content-Type" "text/html"}
   :body    "Testic"})
["mosa"]
(fn[req] 
  {:status 200 :headers {"Content-Type" "text/html"}
   :body    "Testic?"})
[&]
(fn[req] 
  {:status 400 :headers {"Content-Type" "text/html"}
   :body    "Not found?"})

	    ))

(defn boot []
  (run-jetty #'ruter {:port 7079}))

(comment
(defonce server (run-jetty #'ruter {:port 7079 :join false}))
)

