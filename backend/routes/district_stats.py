import os
import json
import logging
from flask import Blueprint, jsonify, request

bp_district_stats = Blueprint('district_stats', __name__)

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'district_stats.json')

# Setup basic logging (only if not already configured by the app)
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s in %(name)s: %(message)s')

with open(DATA_PATH, 'r') as f:
    _raw_data = json.load(f)

# Normalize top-level state keys to a canonical lowercase-with-spaces form
# e.g. "Bihar" -> "bihar", "Madhya Pradesh" -> "madhya pradesh"
DISTRICT_DATA = {}
for original_key, value in _raw_data.items():
    canon = original_key.strip().lower().replace('_', ' ')
    # If duplicates collapse/merge (simple preference: later overwrites)
    DISTRICT_DATA[canon] = value
logger.info("Loaded district stats for states: %s", sorted(DISTRICT_DATA.keys()))

def normalize_state_name(name: str) -> str:
    return (name or '').strip().lower().replace('_', ' ')

# Common alias tokens (without spaces) -> canonical spaced name
ALIASES = {
    'andhrapradesh': 'andhra pradesh',
    'arunachalpradesh': 'arunachal pradesh',
    'madhyapradesh': 'madhya pradesh',
    'uttarpradesh': 'uttar pradesh',
    'jammukashmir': 'jammu and kashmir',
    'tamilnadu': 'tamil nadu'
}

@bp_district_stats.route('/district_stats', methods=['GET'])
def get_state_district_stats():
    state = request.args.get('state', '')
    norm = normalize_state_name(state)
    if not norm:
        logger.warning("district_stats: missing state param")
        return jsonify({"error": "state query param required"}), 400

    compact = norm.replace(' ', '')
    if compact in ALIASES:
        norm = ALIASES[compact]

    data = DISTRICT_DATA.get(norm)

    if data is None:
        # Try secondary fuzzy style match: remove spaces, compare against keys w/o spaces
        nospace_map = {k.replace(' ', ''): k for k in DISTRICT_DATA.keys()}
        fallback_key = nospace_map.get(compact)
        if fallback_key:
            data = DISTRICT_DATA[fallback_key]
            norm = fallback_key
            logger.info("district_stats: matched fallback key '%s' -> '%s'", state, norm)

    if data is None:
        logger.warning("district_stats: no data for state input='%s' norm='%s' available=%s", state, norm, sorted(DISTRICT_DATA.keys()))
        return jsonify({"error": f"No data for state '{state}'"}), 404

    total_calls = sum((d.get('calls', 0) for d in data.values())) if isinstance(data, dict) else 0

    logger.info("district_stats: served state='%s' districts=%d total_calls=%d", norm, len(data) if isinstance(data, dict) else -1, total_calls)

    return jsonify({
        "state": norm,
        "total_calls": total_calls,
        "districts": data
    })
