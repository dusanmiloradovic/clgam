(ns clgam.long-poll
  (:use aleph.core lamina.core aleph.http)
  (:use [net.cgrand.moustache :only [app]])
  (:use ring.middleware.file)
  (:use ring.middleware.file-info)
  (:use ring.middleware.content-type)
  (:use ring.middleware.params)
  (:use  [clojure.contrib.str-utils :only [str-join]])
  )

(def ulazniq (channel))

(defn fillq [{params :params}]
  (let [val (params "val")]
     (enqueue ulazniq val)
    )
    {:status 200
   :headers {"content-type" "text/plain"}
   :body ""}
  )

(receive-all ulazniq (fn[x] (println "praznim" x)))

(defn long-poll-handler [ch request]
  (when (not (closed? ch))
    (async
     (receive (fork ulazniq)
	      (fn[x]
		(enqueue ch
			 {:status 200, :headers {"content-type" "text/plain"}, :body x}))))))

(def ruter (app
            (wrap-file-info)
            (wrap-file "src/webstatic")
            (wrap-content-type)
            ["queuein"] (wrap-params fillq)
            ["poll"]
            (wrap-params (wrap-aleph-handler long-poll-handler))
            ))

(def stop (start-http-server (wrap-ring-handler ruter) {:port 8080}))