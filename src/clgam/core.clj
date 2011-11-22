(ns clgam.core)
(def up [0 1])
(def down [0 -1])
(def right [1 0])
(def left [-1 0])
(defstruct koord :xcoord, :ycoord)
(defn move-up [koords]
  (struct-map koord :xcoord (:xcoord koords)
	      :ycoord (+ 1 (:ycoord koords))))
(defn move-right [koords]
  (struct-map koord :xcoord (+ 1 (:xcoord koords))
	      :ycoord (:ycoord koords)))
(def move-up-right-diag (comp move-up move-right))

(defn move-up [koords]
  (struct-map koord :xcoord (:xcoord koords)
	      :ycoord (+ 1 (:ycoord koords))))
(defn move
  [board-check  direction koords]
  (let [new_koords     (struct-map koord :xcoord (+ (direction 0) (:xcoord koords))
				   :ycoord (+ (direction 1) (:ycoord koords)))]
    (if (board-check new_koords)
      new_koords
      nil
      )))

(defn kvadratna_tabla[n & pocetni_podaci]
  [(if pocetni_podaci
     pocetni_podaci
     (let [row (vec (replicate n nil))
	   board (vec (replicate n row))]
     board))
   (fn[koords]
     (and   (<= 0 (:xcoord koord)) (> n (:xcoord koord))
	    (<= 0 (:ycoord koord)) (> n (:ycoord koord))
	    )
     )
   ]
  )

(def tictactoeboard (kvadratna_tabla 3))

(def tictactoe_static
     [["W" "B"], ["white.gif" "black.gif"]])

(defn random_igrac
  ([] ((vec (tictactoe_static 0)) (rand-int 2)))
  ([postojeca]
     (let [ostatak (vec (remove (set postojeca) (tictactoe_static 0)))]
     (ostatak (rand-int (count ostatak))))))
  

(def soba (ref {}))

(def igraci (ref {}))

(def igre (ref {}))

(defn postavi_igru[igra username]
  "prvo cu da stavim uid kao system.currenttime, a posle cu da cuvam sekvencu u bazi"
  (let [game_id (gensym) , figura (random_igrac)]
    
    (dosync
     (alter soba assoc game_id (list username))
     (alter igraci assoc username [figura game_id])
     )))


    
    
    
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





(defn figure[tabla koordinate]
  ((tabla (:ycoord koordinate)) (:xcoord koordinate)))

(defn connected_direction [tabla figura koordinate  board_check direction]
  (loop [tabla tabla figura figura koordinate koordinate direction direction board_check board_check connected 0]
    (let [nova_poz (move board_check direction koordinate)]
      (if (and nova_poz (= figura (figure tabla nova_poz)))
	(recur tabla figura nova_poz direction board_check (+ 1 connected))
	connected
	)
      )
    )
  )

(defn opposite [direction]
  [ (* -1 (direction 0)) (* -1 (direction 1))]
  )

(defn connected_both [tabla figura koordinate board_check direction]
  (let [fja (partial connected_direction tabla figura koordinate board_check)]
    (+ 1 (fja direction) (fja (opposite direction)))
    )
  )





(defn diag_up_connected[tabla figura koordinate board_check]
  (connected_both tabla figura koordinate board_check (vec (map + up right))))

(defn diag_down_connected[tabla figura koordinate board_check]
  (connected_both tabla figura koordinate board_check (vec (map + up left))))


(defn hor_connected[tabla figura koordinate board_check]
  (connected_both tabla figura koordinate board_check right))

(defn ver_connected[tabla figura koordinate board_check]
  (connected_both tabla figura koordinate board_check up))


(defn pretty-print [tabla]
  (for [x tabla]
    (when (vector? x)
      (println x)))
  )


(defrecord Partija [igraci tabla sledeci_igrac istorija_poteza event_fx])

(comment
  Ideja je da se napravi event za svaku pojedinu igru.
  Neki eventi ce biti genericki za sve igre, kao sto ce biti event "greska",
  "invalid move", "pobeda", "remi" itd.

  Event treba da okine event handler, a on ce biti definisan za igru, a moze i
  da se prosledi kao funkcija. Npr. sada kada neko dobije, event handler moze da
  zabrani dalju igru (sto bi moglo da bude zajednicko za sve igre) i onda da odstampa na ekranu "pobeda". Kada se bude razvio web klijent za igru, hendler moze da obavi jos dodatnih akcija.
  )

(defn igrac[ime simbol]
  {:ime ime :simbol simbol})

(defn startuj-partiju[igraci tabla event_fx]
  (ref  (Partija.  igraci tabla nil nil event_fx)))



(defn tictactoeevents[partija]
  (let [tabla (:tabla @partija), tictactoeboard (fnext tabla)]
    [
     {
      :event
      (fn mosha[igrac figura koordinate]
	(println "uso")
	(or (= 3 (diag_up_connected tabla figura koordinate tictactoeboard))
	    (= 3 (diag_down_connected tabla figura koordinate tictactoeboard))
	    (= 3 (hor_connected tabla figura koordinate tictactoeboard))
	    (= 3 (ver_connected tabla figura koordinate tictactoeboard))
	    )
	)

      :handler
      (fn b[]
	(dosync
	 (println (str "Igrac" (:sledeci_igrac @partija) " je pobedio") )
	 (alter partija merge {:game_over true })))
      }
     {
      :event
      (fn c[igrac figura koordinate]
	(println "uso")
	((comp not nil?)
	 (figure tabla koordinate)
	 )
	)

      :handler
      (fn d[]
	(dosync
	 (alter partija merge {:invalid_move true})
	 (println "Invalid move")
	 )
	)
      }
     ]
    )
  )


(defn join_game[game_uid username]
  "Kada je igra postavljena ceka se da se prijavi dovoljan broj igraca.(za iks oks jos samo jedan. Kada su svi prijavljeni, treba startovati igru i prodruziti joj game_uid"
  (let [svi_igraci (cons username (@soba game_uid))
	zauzete_figure (map #((% 1)0) (select-keys @igraci (@soba game_uid)))
	figura (random_igrac zauzete_figure)
	]
    (when figura
      (dosync
       (alter soba assoc game_uid list(username))
       (alter igraci assoc username [figura game_uid])
       (when (= (count svi_igraci) 2)
         (alter igre assoc (startuj-partiju svi_igraci tictactoeboard tictactoeevents)))
       ))))

(defn check_rules[partija igrac koordinate figura]
  (some true?
	(let [ev_functions (:event_fx @partija) events (ev_functions partija)]
	  (for [xxx events]
	    (let [happened ((:event xxx) igrac figura koordinate)]
	      (when happened
		(do
		  ((:handler xxx))
		  true
		  )))))))


(defn kor [x y]
  (struct-map koord :xcoord x :ycoord y))


(defn play[partija koordinate igrac figura & review]
  (when-not (and  (nil? review) (:game_over @partija))
    (dosync
     (alter partija merge {:invalid_move false}))
    (let [tabla (:tabla @partija) event_functions (:event_fx @partija)]
      (if (and (not (nil? (:sledeci_igrac @partija))) (not= (:sledeci_igrac @partija) igrac))
	(println "Pogresan igrac")
	(if
	    (and
	     (check_rules partija igrac koordinate figura)
	     (or  (:invalid_move @partija) (:game_over @partija)))

	  nil
	  (let [nova_tabla (place tabla figura koordinate) pre_promene @partija]
	    (if nova_tabla
	      (dosync
	       (alter partija merge {:tabla nova_tabla  :sledeci_igrac (next_player igrac (:igraci @partija)) :istorija_poteza (cons pre_promene (:istorija_poteza @partija))})
	       nil))
	    ))))))

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


