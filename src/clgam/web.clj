(ns clgam.web
  (:use ring.adapter.jetty)
  (:use net.cgrand.enlive-html)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use  [clojure.contrib.str-utils :only [str-join]])
  (:use somnium.congomongo)
  )
(comment	    (wrap-file "src/webstatic"))

(defn construct-url [url]
  (str-join "/" url))

(defonce mongocon (make-connection "testaj"))

(set-connection! mongocon)

(defn get-mongo-file[path]
  (stream-from :testaj (construct-url path)))

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
["mongoize" & putanja]
(fn[req] 
  {:status 200 :headers {"Content-Type" "text/html"}
   :body (get-mongo-file putanja)})
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


(def fs (get-gridfs "testaj"))


  
  

