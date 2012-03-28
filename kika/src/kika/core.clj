(ns kika.core
  (:use aleph.core lamina.core aleph.http)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use ring.middleware.file-info)
  (:use ring.middleware.content-type)
  (:use ring.middleware.params)
  (:use ring.middleware.session)
  (:require [ring.util.response :as r]))

(def kanal (channel))

(defn fillq [{body :body query-string :query-string  headers :headers}]
  (do
    (println "requst ima body " body query-string headers)
    (enqueue kanal body)
    (r/response "response")
    ))

(defn longpoll [ch request]
  (println "ulazim u longpoll")
  (siphon kanal ch)
  )
  

;;(receive-
;;(defn longpoll 
(def ruter (app
            ["queuein"] fillq
            ["longpoll"] (wrap-aleph-handler longpoll)
            ))
(defonce stop
  (start-http-server (wrap-ring-handler #'ruter) {:port 8080}))