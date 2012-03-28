(defproject kika "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [enfocus "0.9.1-SNAPSHOT"]
                 [ring "1.0.2"]
                 [enlive "1.0.0"]
                 [net.cgrand/moustache "1.1.0"]
                 [aleph "0.2.1-alpha1"]
                 ]
  :plugins [[lein-cljsbuild "0.1.2"]]
  :cljsbuild {
              :repl-listen-port 9000
              :repl-launch-commands
              {"firefox-naked" ["firefox"
                                "resources/public/html/naked.html"
                                :stdout ".repl-firefox-naked-out"
                                :stderr ".repl-firefox-naked-err"]}
              :builds [
                       {:source-path "src"
                        :jar true
                        :compiler {:output-to "resources/js/main.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]})
  