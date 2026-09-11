# Framerate — 30fps acum, 60fps la livrabil

> **Pentru Claude Code:** execută ce e mai jos, apoi push și raw.mkv.
> Nu trece la faza 5.

---

## Poziția

**30fps nu se acceptă ca soluție permanentă.**

Money shot-ul e o animație de numere care curge. La 30fps o tranziție de ~1.4s
are 42 de cadre în loc de 84. Nu se vede ca sacadare evidentă — se simte ca
„ieftin", pe cadrul care trebuie să convingă. Exact locul unde nu ai voie să
economisești.

## Ce facem acum

Filmăm la **30fps pentru faza 6**. E suficient ca să judec ritmul și
economisește timp real la 15+ iterații.

## Ce vreau înainte de livrabilul final

**60fps.** Verifică ce e fezabil pe mașina asta:

- Postgres pe alt core (affinity / cgroup), sau oprit complet în timpul
  capturii dacă datele pot fi pre-încărcate în memorie
- preset ffmpeg cât mai rapid la captură (`ultrafast`, `-qp 0`) — encodarea
  grea rămâne în post, nu în timpul filmării
- limitarea numărului de workeri Next la runtime
- orice altceva care scoate concurența de pe cele două nuclee în timpul
  celor 45 de secunde

Spune-mi concret ce e realist, nu ce e teoretic posibil.

## Varianta de rezervă

Dacă 60fps chiar nu intră pentru tot timeline-ul: **filmăm doar beat-ul money
la 60fps**, restul la 30, și se lipesc la montaj.

E mai simplu decât pare — ai deja `--beat=<id>` implementat.

---

## Apoi

1. Dă push
2. Arată-mi `raw.mkv`

Bugul `killzone` / `sessionType` rămâne task separat. Nu-l atinge.
