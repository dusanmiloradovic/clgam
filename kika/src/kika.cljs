(ns kika
  (:require [clojure.browser.repl :as repl]
            [enfocus.core :as ef]
            [goog.dom :as dom])
  (:require-macros [enfocus.macros :as em]))

(defn dusan[x]
  (+ 1 x))
(defn kika [x]
  (js/alert x))

(def queuein "http://localhost:8080/queuein")
(def longpoll "http://localhost:8080/longpoll")

(repl/connect "http://localhost:9000/repl")

(defn start2[c]
    (em/at js/document
           ["body"] (em/content c)))

(def xhr xhr-connection)

(defn callback1[reply]
  (em/at js/document
         ["#div1"] (em/append reply)))

(defn callback2[reply]
  (em/at js/document["#div2"]
         (em/content reply)))


(defn ajax-call [url callback]
  (.send xhr url callback))