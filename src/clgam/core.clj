(ns clgam.core
  (:use lamina.core clgam.core.table))

(defn random_igrac
  ([] ((vec (tictactoe_static 0)) (rand-int 2)))
  ([postojeca]
     (let [ostatak (vec (remove (set postojeca) (tictactoe_static 0)))]
     (ostatak (rand-int (count ostatak))))))

(def soba (ref {:chat-channel (channel), :game-list-channel (channel)}))

(comment game-list-channel mi samo sluzi da se objavi da je nova igra
	 objavljena, ili da stara vise nije raspoloziva. Ne mogu da koristim kanal da
	 distribuiram koje su igre raspolozive jer nemam nacina da mi se registruje kada sklonim igru iz kanala. Pitanje je isto kako da sklonim igru iz kanala. Ovako ce da se u ovaj kanal gura i kada se objavi igra i kada se odjavi igra. Tako da ce ovaj kanal biti sasvim dovoljan da opsluzuje i objavljivanje igara i igre koje su u toku. Stalno se gura u ovaj kanal, i to sluzi samo kao trigger za ajax)

(def igraci (ref {}))

(def igre (ref {}))

(def kanali (ref {}))

(defn get-game-invitations[ime_sobe ime_igre]
  "oba parametra za sada ignorisem jerbo imam samo jednu sobu i jednu igru"
  "jer ce kljucevi za mapu biti keywoedi za kanale, a simboli i stringovi za igre"
  (select-keys @soba
	       (clojure.set/difference
		(set (filter (comp not keyword?) (keys @soba)))
		(set (keys @igre)))))

(receive-all (:game-list-channel @soba) (fn[x] ))

(defn postavi_igru
  "prvo cu da stavim uid kao system.currenttime, a posle cu da cuvam sekvencu u bazi"
  [igra username]
  (when-not (@igraci username)
    "ovo ce biti ok kada imam samo jednu igru. za vise igara treba da
proverim i koju igru igra, mada u principu ne bi trebalo da moze da postavi vise od jedne igre, razmislicu"
    (let [game_id (gensym) , figura (random_igrac) , c (channel)]
      (do
	(dosync
	 (alter soba assoc game_id (list username))
	 (alter igraci assoc username [figura game_id])
	 (alter kanali assoc game_id c)
	 )
	(enqueue (:game-list-channel @soba) [game_id username])
	(receive-all c (fn [x]
                         (println (str "Received -----> " x))
			 (when-let [igra (@igre game_id)]
			   (dosync
			    (alter igra #(merge % x))))))))))

(defn place [tabla figura koordinate]
  "tabla je closure sa figurama  i funkcijom validacije polja"
  (let [tabla_podaci (first tabla)]
    (when ((fnext tabla) koordinate)
      (cons
       (assoc tabla_podaci (:ycoord koordinate) (assoc (tabla_podaci (:ycoord koordinate)) (:xcoord koordinate) figura)) (next tabla)
       ))))
    
(defn next_player [current_player players]
  (let [nextone
	(loop [current_player current_player players players]
	  (if (= current_player (first players))
	    (fnext players)
	    (recur current_player (next players))))
	]
    (if nextone
      nextone
      (first players))))

(defrecord Partija [igraci tabla sledeci_igrac istorija_poteza event_fx game_uid])

(comment
  Ideja je da se napravi event za svaku pojedinu igru.
  Neki eventi ce biti genericki za sve igre, kao sto ce biti event "greska",
  "invalid move", "pobeda", "remi" itd.

  Event treba da okine event handler, a on ce biti definisan za igru, a moze i
  da se prosledi kao funkcija. Npr. sada kada neko dobije, event handler moze da
  zabrani dalju igru (sto bi moglo da bude zajednicko za sve igre) i onda da odstampa na ekranu "pobeda". Kada se bude razvio web klijent za igru, hendler moze da obavi jos dodatnih akcija.
  )

(defn startuj-partiju[igraci tabla event_fx game_uid]
  (ref  (Partija.  igraci tabla nil nil event_fx game_uid)))

(defn join_game
  "Kada je igra postavljena ceka se da se prijavi dovoljan broj igraca.(za iks oks jos samo jedan. Kada su svi prijavljeni, treba startovati igru i prodruziti joj game_uid"
  [game_uid username]
  (let [svi_igraci (cons username (@soba game_uid))
	zauzete_figure (map #((% 1)0) (select-keys @igraci (@soba game_uid)))
	figura (random_igrac zauzete_figure)
	]
    (when (and figura (not (some #(= username %) (@soba game_uid))))
      "ne mozaes da se pridruzis svojoj igri"
      (do
	(dosync
	 (when (and (@igraci username) (@soba ((@igraci username) 1)))
	   (alter soba dissoc ((@igraci username) 1)))
	 (alter soba assoc game_uid (cons username (@soba game_uid)))
	 (alter igraci assoc username [figura game_uid])
	 (when (= (count svi_igraci) 2)
	   (alter igre assoc game_uid (startuj-partiju svi_igraci tictactoeboard tictactoeevents game_uid)))
	 )
	(enqueue (:game-list-channel @soba) [game_uid username])
	))))

(defn user_game [username]
  (when-let [poceta-igra (@igraci username)]
    [(poceta-igra 1) "tictactoe"]))

(defn check_rules[partija igrac koordinate figura & validations?]
  (let [ev_functions (:event_fx @partija)
        events-h (ev_functions partija)
        events (if validations? (:validations events-h) (:events events-h))
        game_uid (:game_uid @partija)
        game_channel (game_uid @kanali)
        ]
    (not-empty
     (map #(enqueue game_channel %)
          (remove nil?
                  (for [xxx events]
                    (when ((:event xxx) igrac figura koordinate)
                      (:handler xxx))))))))
(defn kor [x y]
  (struct-map koord :xcoord x :ycoord y))


(defn play
  [partija koordinate igrac figura & review]
  (when-not (and  (nil? review) (:game_over @partija))
    (dosync
     (alter partija merge {:invalid_move false}))
    (let [tabla (:tabla @partija) ]
      (let [game_uid (:game_uid @partija) , game_channel (@kanali game_uid)
            kopija (receive-all (fork game_channel) (fn[_])),
            rule_event_happened (check_rules partija igrac koordinate figura true)
            ]
        (when
            (or (not rule_event_happened)
                (and
                 rule_event_happened
                 kopija
                 (not (or  (:invalid_move @partija) (:game_over @partija)))))
          (let [nova_tabla (place tabla figura koordinate) pre_promene @partija]
            (dp
             (when nova_tabla
               (dosync
                (alter partija merge {:tabla nova_tabla  :sledeci_igrac (next_player igrac (:igraci @partija)) :istorija_poteza (cons pre_promene (:istorija_poteza @partija))})))
             (check_rules partija igrac koordinate figura false)
             )))))))


(defn play-game [guid igrac {:keys [xfield, yfield,picsym]}]
  (let [partija (@igre (symbol guid))
	figura_p (if picsym picsym ((@igraci igrac)0))]
    (play partija (kor xfield yfield) igrac figura_p))
  )

(defn revert[partija]
  (dosync
   (ref-set partija (first (:istorija_poteza @partija)))))

(require '[clojure.zip :as zip])

(defn startuj-review[partija] (zip/down (zip/seq-zip (seq (:istorija_poteza @partija)))))

(defn review-right [review]
  (let [pos (zip/right review)]
    (if (seq? (zip/node pos))
      (recur (zip/down pos))
      pos
      )))

(defn review-play [review igrac koordinate figura]
  (let [played (play (zip/node review) koordinate igrac figura true)]
    (let [to_replace
          (if-let [current_game (zip/node review)]
            (cons current_game played)
            played)]
      (zip/replace to_replace))))

(defmacro defrecord-withstr [name fields columns include?]
  (let [displayed (if include? columns (remove (set columns) fields))
	labls (map #(str ":" %) displayed)
	]
    `(defrecord ~name ~fields
       Object
       (toString [_#]
		 (clojure.string/join " "
				      (interleave
				       [~@labls]
				       [~@displayed]))))))

(def boards
     {:tictactoe [3 3],
      :go [19 19]})

(defn transfer-board-koords[x y game]
  (let [[xb yb] (boards (keyword game))]
    {:xfield (int (* x xb)) , :yfield (int (* y yb))}
    ))
