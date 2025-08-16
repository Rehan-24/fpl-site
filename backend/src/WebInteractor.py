# Imports
import json
import requests
from typing import List
from urllib.parse import urljoin


# Classes
class WebInteractor():
    base_url = 'https://fantasy.premierleague.com/api/'

    def __init__(self, league_id):
        self._league_id = league_id

    @property
    def league_id(self):
        return self._league_id

    def retrieve_data(self):
        pass

    def get_campaign_data(self) -> List[dict]:
        """
        """
        all_campaign_data = []
        page_num = 1
        retrieve_data = True
        while retrieve_data:
            endpoint = f'leagues-h2h-matches/league/{self.league_id}/?page={page_num}'
            league_standings_url = urljoin(self.base_url, endpoint)

            response = requests.get(league_standings_url)
            data = response.json()
            retrieve_data = data['has_next']
            all_campaign_data.extend(data['results'])
            
            page_num += 1
        
        return all_campaign_data

    def get_manager_data(self, managers: List[int]) -> dict:
        """
        """
        manager_data = {}

        for manager_id in managers:
            if manager_id is None:
                continue
            endpoint_info = f'entry/{manager_id}'
            endpoint_history = f'entry/{manager_id}/history'
            info_url = urljoin(self.base_url, endpoint_info)
            history_url = urljoin(self.base_url, endpoint_history)

            info_response = requests.get(info_url)
            info_data = info_response.json()

            history_response = requests.get(history_url)
            history_data = history_response.json()

            manager_data[manager_id] = {
                'info_data': info_data,
                'history_data': history_data,
            }

        return manager_data

