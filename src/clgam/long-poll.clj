(ns clgam.long-poll
    (:use aleph.core lamina.core aleph.http)
  )
(defn long-poll-handler [ch request]
  (receive (named-channel (:body request))
           #(enqueue ch
                     {:status 200
                      :headers {"content-type" "text/plain"}
                      :body %}))
  )

(start-http-server long-poll-handler {:port 8080})