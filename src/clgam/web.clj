(ns clgam.web
  (:use ring.adapter.jetty)
  (:use net.cgrand.enlive-html)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use ring.middleware.content-type)
  (:use ring.middleware.params)
  (:use  [clojure.contrib.str-utils :only [str-join]])
  (:use somnium.congomongo)
  (:require  [clgam.core :as c])
  (:require [clojure.contrib.json :as j])
  )

(defn construct-url [url]
  (str-join "/" url))

(defonce mongocon (make-connection "testaj"))

(set-connection! mongocon)

(defn get-mongo-file[path]
  (println path)
  (stream-from :fs
               (fetch-one-file :fs :where
                               {:filename (construct-url path)}
                               )))
(defn tictactoehandler [{params :params}]
  (let [[x y] (map #(Double/parseDouble %) [(params "xcoord") (params "ycoord")])]
    (println (params "xcoord"))
    {:status 200
     :headers {"Content-Type" "text/html"}
     :body (j/json-str (c/transfer-board-koords x y "tictactoe"))}
    ))
(def ruter (app
	    (wrap-file "src/webstatic")
    	    (wrap-content-type)
	    ["nosa"]
	    (fn[req]
	      {:status 200
	       :headers {"Content-Type" "text/html"}
	       :body    "Testic"})
	    ["mongoize" & putanja]
	    (fn[req]
	      (if-let [f (get-mongo-file putanja)]
		{:status 200 :body f}
		{:status 404 :headers {"Content-Type" "text/html"} :body "Greska"}
		))
            ["tictactoe"]
            (wrap-params tictactoehandler)
            ["ajax" & putanja]
	    (fn[req]
              (println (slurp(:body req)))
	      {:status 200
       	       :headers {"Content-Type" "text/html"}
	       :body (str "<html>" (apply str putanja) "</html>")})
            
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


  
  

