(ns clgam.core.table)
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

(defn tictactoeevents[partija]
  (let [tabla (first (:tabla @partija)) , tictactoeboard (fnext (:tabla @partija))]
    [
     {
      :event
      (fn mosha[igrac figura koordinate]
	(or (= 3 (diag_up_connected tabla figura koordinate tictactoeboard))
	    (= 3 (diag_down_connected tabla figura koordinate tictactoeboard))
	    (= 3 (hor_connected tabla figura koordinate tictactoeboard))
	    (= 3 (ver_connected tabla figura koordinate tictactoeboard))
	    )
	)
      ,
      :handler
      {:game_over true , :winner (:sledeci_igrac @partija) }
      }
     {
      :event
      (fn c[igrac figura koordinate]
	(println (str "c" igrac figura koordinate))
	((comp not nil?)
	 (figure tabla koordinate)
	 )
	)
      :handler
      {:invalid_move true}
      
      }
     ]
    )
  )