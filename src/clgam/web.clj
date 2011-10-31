(ns clgam.web
  (:use ring.adapter.jetty)
  (:use net.cgrand.enlive-html)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use ring.middleware.content-type)
  (:use  [clojure.contrib.str-utils :only [str-join]])
  (:use somnium.congomongo)
  )
(comment	    (wrap-file "src/webstatic"))

(defn construct-url [url]
  (str-join "/" url))

(defonce mongocon (make-connection "testaj"))

(set-connection! mongocon)

(defn get-mongo-file[path]
  (stream-from :fs
               (fetch-one-file :fs :where
                               {:filename (construct-url path)}
                               )))

(def ruter (app
	    (wrap-content-type)
	    (wrap-file "src/webstatic")
	    ["nosa"]
	    (fn[req] 
	      {:status 200 
	       :body    "Testic"})
	    ["mosa"]
	    (fn[req] 
	      {:status 200 
	       :body    "Testic?"})
	    ["mongoize" & putanja]
	    (fn[req]
	      (if-let [f (get-mongo-file putanja)]
		{:status 200 :body f}
		{:status 400}
		))
	    [&]
	    (fn[req] 
	      {:status 400 
	       :body    "Not found?"})
	    ))

(defn boot []
  (run-jetty #'ruter {:port 7079}))

(comment
(defonce server (run-jetty #'ruter {:port 7079 :join false}))
)


(def fs (get-gridfs "testaj"))


  
  

