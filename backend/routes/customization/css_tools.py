from flask import Blueprint, request, jsonify
import rcssmin

css_tools_bp = Blueprint("css_tools", __name__)


@css_tools_bp.route("/api/customization/css/minify", methods=["POST"])
def minify_css():
    data = request.get_json(silent=True) or {}
    css = data.get("css", "")

    if not css.strip():
        return jsonify({"css": ""}), 200

    try:
        minified = rcssmin.cssmin(css)
        return jsonify({"css": minified}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 422
