from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            budget = data.get('budget', 2600)
            location = data.get('location', 'Midtown')
        except:
            budget = 2600
            location = "Midtown"

        listings = [
            {
                "id": 1,
                "title": f"Sunny 1BR in {location}",
                "price": budget - 150,
                "commuteTimeMin": 18,
                "description": "Charming south-facing unit with hardwood floors.",
                "score": 95
            },
            {
                "id": 2,
                "title": f"Modern Studio near {location}",
                "price": budget - 300,
                "commuteTimeMin": 22,
                "description": "Sleek studio apartment with in-unit laundry.",
                "score": 89
            }
        ]

        response_data = {
            "status": "success",
            "search_query": location,
            "listings": [item for item in listings if item["price"] <= budget]
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
