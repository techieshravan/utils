import html
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

LINKS = os.path.join(os.path.dirname(__file__), "links.json")


def load():
    # ponytail: re-read per request so edits apply with no restart.
    # File is tiny; if it ever gets big, cache + watch mtime.
    with open(LINKS) as f:
        return json.load(f)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        key = self.path.strip("/").split("?")[0].split("/")[0].lower()
        links = load()
        if key in links:
            self.send_response(302)
            self.send_header("Location", links[key])
            self.end_headers()
        else:
            # bare "/" or unknown -> list everything
            rows = "".join(
                f'<li><a href="{html.escape(u)}">go/{html.escape(k)}</a> &rarr; {html.escape(u)}</li>'
                for k, u in sorted(links.items())
            )
            body = f"<h1>go links</h1><ul>{rows}</ul>"
            self.send_response(404 if key else 200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(body.encode())

    def log_message(self, *a):  # silence request logging
        pass


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 80), Handler).serve_forever()
