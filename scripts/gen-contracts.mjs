#!/usr/bin/env node
// Generate joke/excuse/prediction/story_wars.py from a parameterized template
// matching the structure of the now-working pitch_wars.py, sharing identical
// scaffolding (storage, submit_entry, finalize_*, views) but with per-game
// field names, score keys, and AI prompt text.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "contracts");

const GAMES = [
  {
    file: "joke_wars.py",
    cls: "JokeWars",
    finalize: "finalize_jokes",
    item: "joke",
    items: "jokes",
    metaKey: "category",
    metaPlaceholder: "Dad jokes",
    scoreKeys: ["funniness", "originality", "timing", "groans"],
    judgeRole: "brutally honest comedy judge",
    battleNoun: "joke battle",
    overallNoun: "comedy performance",
    criteria: [
      "funniness - Overall funniness across all their jokes",
      "originality - How original and fresh were their jokes across rounds?",
      "timing - Consistent setup/punchline quality across the game",
      "groans - Groan-worthiness - for puns/dad jokes this is the highest honour",
    ],
    roastDescription: "short comedy critic roast on their overall game",
  },
  {
    file: "excuse_wars.py",
    cls: "ExcuseWars",
    finalize: "finalize_excuses",
    item: "excuse",
    items: "excuses",
    metaKey: "crime",
    metaPlaceholder: "stole a bagel",
    scoreKeys: ["believability", "creativity", "desperation", "legal_viability"],
    judgeRole: "skeptical AI courtroom judge",
    battleNoun: "excuse battle",
    overallNoun: "excuse-making performance",
    criteria: [
      "believability - Could a tired teacher actually buy this?",
      "creativity - Fresh angles, unexpected scapegoats, narrative twists",
      "desperation - Pure unhinged energy of someone caught red-handed",
      "legal_viability - Would this hold up in small claims court?",
    ],
    roastDescription: "short witty roast of their excuse style",
  },
  {
    file: "prediction_wars.py",
    cls: "PredictionWars",
    finalize: "finalize_predictions",
    item: "prediction",
    items: "predictions",
    metaKey: "topic",
    metaPlaceholder: "AI in 2030",
    scoreKeys: ["plausibility", "originality", "hype_level", "would_actually_happen"],
    judgeRole: "cynical futurist AI oracle",
    battleNoun: "prediction battle",
    overallNoun: "predictive performance",
    criteria: [
      "plausibility - Does this sound at all internally consistent?",
      "originality - Fresh takes vs warmed-over hot takes from Twitter",
      "hype_level - Did they sell the future like a true cult leader?",
      "would_actually_happen - Cold realistic odds this comes true",
    ],
    roastDescription: "short oracle-style roast of their prophecy",
  },
  {
    file: "story_wars.py",
    cls: "StoryWars",
    finalize: "finalize_stories",
    item: "story",
    items: "stories",
    metaKey: "prompt_combo",
    metaPlaceholder: "vampires + IKEA",
    scoreKeys: ["storytelling", "economy_of_words", "emotion", "twist_quality"],
    judgeRole: "ruthless literary critic",
    battleNoun: "flash-fiction battle",
    overallNoun: "storytelling",
    criteria: [
      "storytelling - Beginning, middle, and end in too few words",
      "economy_of_words - Maximum impact per syllable",
      "emotion - Did it actually make you feel anything?",
      "twist_quality - Was there a real surprise or just filler?",
    ],
    roastDescription: "short literary-critic roast of their prose",
  },
];

function tpl(g) {
  const [k1, k2, k3, k4] = g.scoreKeys;
  const criteriaList = g.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const exampleResult =
    `{{"address": "0xFULL_ADDRESS", "${k1}": 7, "${k2}": 7, "${k3}": 7, "${k4}": 7, "total": 28, "roast": "${g.roastDescription}"}}`;
  return `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

RANK_XP = {1: 500, 2: 300, 3: 150, 4: 50, 5: 50, 6: 50}
MAX_TEXT_LEN = 2000
MAX_ROUNDS = 50
MAX_PLAYERS = 6


def _safe_address(raw: str) -> Address:
    return Address(raw.lower())


def _validate_game_id(game_id: str) -> None:
    if not isinstance(game_id, str) or len(game_id) < 4 or len(game_id) > 80:
        raise Exception("bad game_id")


class ${g.cls}(gl.Contract):
    xp:        TreeMap[Address, u256]
    games:     TreeMap[Address, u256]
    last_week: TreeMap[Address, u256]
    submissions: TreeMap[str, str]
    finalized:   TreeMap[str, u256]

    def __init__(self) -> None:
        pass

    @gl.public.write
    def submit_entry(self, game_id: str, round_num: int, text: str) -> None:
        _validate_game_id(game_id)
        if not isinstance(round_num, int) or round_num < 1 or round_num > MAX_ROUNDS:
            raise Exception("bad round")
        if not isinstance(text, str) or len(text) == 0 or len(text) > MAX_TEXT_LEN:
            raise Exception("bad text")
        if self.finalized.get(game_id, u256(0)) != u256(0):
            raise Exception("game already finalized")

        sender = gl.message.sender_address.as_hex.lower()
        existing = self.submissions.get(game_id, "")
        entries = json.loads(existing) if existing else []

        replaced = False
        for e in entries:
            if int(e.get("round", 0)) == round_num and e.get("addr", "").lower() == sender:
                e["text"] = text
                replaced = True
                break
        if not replaced:
            entries.append({"round": round_num, "addr": sender, "text": text})

        self.submissions[game_id] = json.dumps(entries)

    @gl.public.write
    def ${g.finalize}(self, game_id: str, rounds_meta_json: str, current_week: int) -> str:
        _validate_game_id(game_id)
        if self.finalized.get(game_id, u256(0)) != u256(0):
            raise Exception("game already finalized")

        rounds_meta = json.loads(rounds_meta_json)
        if not isinstance(rounds_meta, list) or len(rounds_meta) == 0:
            raise Exception("empty rounds_meta")

        existing = self.submissions.get(game_id, "")
        if not existing:
            raise Exception("no entries for this game")
        entries = json.loads(existing)

        by_round: dict = {}
        all_addresses = set()
        for e in entries:
            rn = int(e.get("round", 0))
            addr = e.get("addr", "")
            text = e.get("text", "")
            if rn < 1 or not addr or not text:
                continue
            by_round.setdefault(rn, []).append({"address": addr, "${g.item}": text})
            all_addresses.add(addr)

        if len(all_addresses) < 2:
            raise Exception("Need at least 2 players")
        if len(all_addresses) > MAX_PLAYERS:
            raise Exception(f"Maximum {MAX_PLAYERS} players per game")

        rounds = []
        for meta in rounds_meta:
            rn = int(meta.get("round", 0))
            rounds.append({
                "round": rn,
                "${g.metaKey}": str(meta.get("${g.metaKey}", "")),
                "${g.items}": by_round.get(rn, []),
            })

        num_players = len(all_addresses)
        num_rounds = len(rounds)

        rounds_text = ""
        for r in rounds:
            rounds_text += f"\\n--- Round {r['round']}: {r['${g.metaKey}']} ---\\n"
            for p in r["${g.items}"]:
                rounds_text += f"  {p['address']}: \\"{p['${g.item}']}\\"\\n"

        prompt = f"""You are a ${g.judgeRole} judging a {num_rounds}-round ${g.battleNoun} on the GenLayer blockchain.

Players competed across {num_rounds} rounds. Judge each player on their OVERALL ${g.overallNoun} across ALL rounds.

{rounds_text}

Score EACH of the {num_players} players on their overall performance across all rounds (0-10 each):
${criteriaList}

Rules:
- Judge each player holistically across ALL their rounds
- Be fair but mercilessly honest
- Differentiate scores - avoid giving everyone the same score
- Total score = sum of all four criteria (max 40)
- Rank players by total score, highest first
- You MUST include ALL {num_players} players in the results
- Use the EXACT full addresses provided

Return ONLY valid JSON with this exact schema:
{{"results": [${exampleResult}], "winner": "0xWINNER_ADDRESS"}}"""

        def leader_fn():
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise Exception("LLM returned non-dict")
            results = result.get("results")
            if not isinstance(results, list) or len(results) == 0:
                raise Exception("Missing results array")
            for r in results:
                v1 = max(0, min(10, int(round(float(r.get("${k1}", 5))))))
                r["${k1}"] = v1
                v2 = max(0, min(10, int(round(float(r.get("${k2}", 5))))))
                r["${k2}"] = v2
                v3 = max(0, min(10, int(round(float(r.get("${k3}", 5))))))
                r["${k3}"] = v3
                v4 = max(0, min(10, int(round(float(r.get("${k4}", 5))))))
                r["${k4}"] = v4
                r["total"] = v1 + v2 + v3 + v4
                if not isinstance(r.get("roast"), str) or len(r.get("roast", "")) == 0:
                    r["roast"] = "No comment."
            results = sorted(results, key=lambda x: x["total"], reverse=True)
            for i, r in enumerate(results):
                r["rank"] = i + 1
            return json.dumps({"results": results, "winner": results[0].get("address", "")}, sort_keys=True)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
            except Exception:
                return False
            if not isinstance(data, dict):
                return False
            results = data.get("results")
            if not isinstance(results, list) or len(results) == 0:
                return False
            for r in results:
                if not isinstance(r, dict):
                    return False
                if not isinstance(r.get("address"), str) or len(r.get("address", "")) < 10:
                    return False
                for key in ("${k1}", "${k2}", "${k3}", "${k4}"):
                    val = r.get(key)
                    if not isinstance(val, (int, float)):
                        return False
                    if val < 0 or val > 10:
                        return False
                if not isinstance(r.get("roast"), str):
                    return False
            if not isinstance(data.get("winner"), str):
                return False
            return True

        verdict_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        verdict = json.loads(verdict_str)

        xp_awards = []
        for result in verdict["results"]:
            try:
                addr = _safe_address(result["address"])
            except Exception:
                result["xp_earned"] = 50
                xp_awards.append(result)
                continue

            rank = min(result.get("rank", 6), 6)
            xp_earned = RANK_XP.get(rank, 50)

            self.xp[addr]        = self.xp.get(addr, u256(0)) + u256(xp_earned)
            self.games[addr]     = self.games.get(addr, u256(0)) + u256(1)
            self.last_week[addr] = u256(current_week)

            result["xp_earned"] = xp_earned
            xp_awards.append(result)

        self.finalized[game_id] = u256(1)
        return json.dumps({"num_rounds": num_rounds, "results": xp_awards, "winner": verdict["winner"]})

    @gl.public.view
    def get_submission_count(self, game_id: str) -> int:
        existing = self.submissions.get(game_id, "")
        if not existing:
            return 0
        try:
            return len(json.loads(existing))
        except Exception:
            return 0

    @gl.public.view
    def is_finalized(self, game_id: str) -> bool:
        return self.finalized.get(game_id, u256(0)) != u256(0)

    @gl.public.view
    def get_leaderboard(self) -> str:
        players = [{"address": addr.as_hex, "xp": int(xp), "games": int(self.games.get(addr, u256(0)))}
                   for addr, xp in self.xp.items()]
        players.sort(key=lambda p: p["xp"], reverse=True)
        return json.dumps(players)

    @gl.public.view
    def get_player_xp(self, player: str) -> int:
        return int(self.xp.get(_safe_address(player), u256(0)))

    @gl.public.view
    def get_player_stats(self, player: str) -> str:
        addr = _safe_address(player)
        return json.dumps({"xp": int(self.xp.get(addr, u256(0))), "games": int(self.games.get(addr, u256(0)))})

    @gl.public.view
    def get_last_played_week(self, player: str) -> int:
        return int(self.last_week.get(_safe_address(player), u256(0)))
`;
}

// Naive ${...} substitution for the template literal above.
function render(g) {
  let s = tpl(g);
  // No additional substitution needed because tpl uses real template literals.
  return s;
}

for (const g of GAMES) {
  const out = render(g);
  await writeFile(path.join(OUT, g.file), out, { encoding: "utf8" });
  console.log(`wrote ${g.file} (${(out.length / 1024).toFixed(1)} KB)`);
}
