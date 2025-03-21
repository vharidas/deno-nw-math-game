# deno-nw-math-game
A multiplayer command line simple math quiz game built over tcp-ip in deno js

# scripts
## start-game
```bash
deno --allow-net start-game.js 30 1
```
- initiates a maths quiz for 1 player
- game starts as soon as the required number of players join the game
- game ends 30 seconds after the game start
## join-game
```bash
deno --allow-net join-game.js localhost john
```
- joins the maths quiz running at localhost as John
- a new question is presented on every answer submition
- every correct answer gets 5 points and every wrong -2
- the results are published when the game ends
## results
```
╭───┬────────────┬──────────┬──────╮
│ # │ Question   │ Solution │ John │
├───┼────────────┼──────────┼──────┤
│ 1 │ ADD 49,45  │       94 │   94 │
│ 2 │ ADD 100,54 │      154 │  154 │
│ 3 │ ADD 62,29  │       91 │  123 │
│ 4 │ ADD 29,94  │      123 │ -    │
╰───┴────────────┴──────────┴──────╯
╭──────┬────────┬─────────┬───────────┬───────╮
│ Rank │ Player │ Correct │ Incorrect │ Score │
├──────┼────────┼─────────┼───────────┼───────┤
│    1 │ John   │       2 │         1 │     9 │
╰──────┴────────┴─────────┴───────────┴───────╯
```