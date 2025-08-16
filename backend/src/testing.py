import requests

manager_id = 4742676  # Replace with an actual manager ID
url = f"https://fantasy.premierleague.com/api/entry/{manager_id}/history"
response = requests.get(url)
history_data = response.json()

print(history_data['chips'])  # Inspect chip usage