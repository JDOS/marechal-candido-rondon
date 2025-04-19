import requests

url = "https://sistemas.itti.org.br/geoserver/rest/"
response = requests.get(url) # Use requests.post, put, delete for other methods

try:
    response = requests.get(url)
    response.raise_for_status() # Raises an exception for bad status codes
    data = response.json()
    print(data)
except requests.exceptions.RequestException as e:
    print(f"Request error: {e}")
except ValueError:
    print("Failed to decode JSON")