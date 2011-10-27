(ns clgam.web
  (:use ring.adapter.jetty)
  (:use net.cgrand.enlive-html)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  )

(def ruter (app
	    (wrap-file "src/webstatic")
	    [""] {:status 404
		 :body "Page Not Found"}))

(defn boot []
  (run-jetty #'ruter {:port 7079}))

(comment
(defonce server (run-jetty #'ruter {:port 7079 :join false}))
)

