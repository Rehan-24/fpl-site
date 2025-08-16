# Imports
from math import floor, sqrt
from typing import List

# Class
class DataInteractor():
    def __init__(self):
        pass

    def get_managers_list(self, campaign_data: List[dict]) -> List[int]:
        """
        Retrieve the matches played in the first gameweek and pull out the manager_ids
        @return a list of the manager ids in the league
        """
        relevant_campaign_data = campaign_data[:10]
        managers = []
        for match in relevant_campaign_data:
            manager1 = match['entry_1_entry']
            manager2 = match['entry_2_entry']
            managers.extend([manager1, manager2])
        
        return managers

    def process_all_data(self, gameweek: int, campaign_data: List[dict], all_manager_data: dict[dict], include_bot=True) -> dict:
        """
        """
        exported_manager_data = {}
        manager_ids_list = list(all_manager_data.keys())

        bot_struct = None
        if include_bot:
            manager_ids_list.append(None)

            # Set up a manager struct with default values 
            bot_struct = self._initialize_struct()
            bot_struct['name'] = 'AVERAGE'
            bot_struct['owner'] = 'AVERAGE (bot)'

        for manager_id in manager_ids_list:
            if manager_id is not None:  # The average bot does not have manager data
                manager_info_data = all_manager_data[manager_id]['info_data']
                manager_history_data = all_manager_data[manager_id]['history_data']
                gameweek_data = manager_history_data['current'][gameweek-1]
                manager_struct = self._initialize_struct()

                manager_struct['gameweek_data'] = {
                    'field_score': gameweek_data['points'],
                    'field_score_against': 0,
                    'bench_score': gameweek_data['points_on_bench'],
                    'transfers': gameweek_data['event_transfers'],
                    'transfers_cost': gameweek_data['event_transfers_cost'],
                }
                manager_struct['campaign_data']['field_score'] = gameweek_data['total_points']

                # Update the struct with the gameweek data
                manager_struct['id'] = manager_id
                manager_struct['name'] = manager_info_data['name']
                manager_struct['owner'] = f"{manager_info_data['player_first_name']} {manager_info_data['player_last_name']}"
                manager_struct['team_value'] = gameweek_data['value']
                manager_struct['bank'] = gameweek_data['bank']

                # Calculate any differences from the previous week
                if gameweek > 1:
                    curr_gw_value = manager_struct['team_value']
                    prev_gw_value = manager_history_data['current'][gameweek-2]['value']
                    delta = curr_gw_value - prev_gw_value
                    manager_struct['gameweek_data']['team_value_delta'] = delta

                # Fill in the data only retrievable by manager data
                for event in manager_history_data['current']:
                    manager_struct['campaign_data']['bench_score'] += event['points_on_bench']
                    manager_struct['campaign_data']['transfers'] += event['event_transfers']
                    manager_struct['campaign_data']['transfers_cost'] += event['event_transfers_cost']

                # Fill in chip usage by gameweek | 0 means unused
                wc_used = 0
                for chip in manager_history_data['chips']:
                    chip_name = chip['name']
                    
                    # look for second wildcard event
                    if chip_name == 'wildcard':
                        wc_used += 1
                        # store the gw which it was used
                        manager_struct['chips'][f'wildcard_{wc_used}'] = chip['event']
                    else:
                        manager_struct['chips'][chip_name] = chip['event']

            # Fill in the data only retrievable in campaign data
            gameweek_count = 0
            log_prospective_matchups = False
            for match in campaign_data:
                # If we hit the end of the campaign or logged the next 3 matchups we are done
                if gameweek_count == 38 or gameweek_count > gameweek + 3:
                    break

                # Determine which structure to use
                if manager_id is None:
                    target_struct = bot_struct
                else:
                    target_struct = manager_struct

                if not log_prospective_matchups:
                    # Use data in entry 1
                    if match['entry_1_entry'] == manager_id:
                        target_struct['record']['wins'] += match['entry_1_win']
                        target_struct['record']['draws'] += match['entry_1_draw']
                        target_struct['record']['losses'] += match['entry_1_loss']
                        target_struct['campaign_data']['field_score_against'] += match['entry_2_points']
                        if manager_id is None:
                            target_struct['campaign_data']['field_score'] += match['entry_1_points']

                    # Use data in entry 2
                    elif match['entry_2_entry'] == manager_id:
                        target_struct['record']['wins'] += match['entry_2_win']
                        target_struct['record']['draws'] += match['entry_2_draw']
                        target_struct['record']['losses'] += match['entry_2_loss']
                        target_struct['campaign_data']['field_score_against'] += match['entry_1_points']
                        if manager_id is None:
                            target_struct['campaign_data']['field_score'] += match['entry_2_points']
                    else:
                        continue

                    # Adds the just played match to the FDR list for the manager
                    if gameweek_count == gameweek:
                        if match['entry_1_entry'] == manager_id:
                            target_struct['fdr_list'] = [match['entry_2_entry']]
                        elif match['entry_2_entry'] == manager_id:
                            target_struct['fdr_list'] = [match['entry_1_entry']]
                        else:
                            continue

                        # I can get the following weeks' matchups once I hit this point
                        log_prospective_matchups = True

                else:  # Adds the upcoming 3 matches (if possible) to the FDR list for the manager
                    if match['entry_1_entry'] == manager_id:
                        target_struct['fdr_list'].append(match['entry_2_entry'])
                    elif match['entry_2_entry'] == manager_id:
                        target_struct['fdr_list'].append(match['entry_1_entry'])
                    else:
                        continue

                gameweek_count += 1            

            exported_manager_data[manager_id] = target_struct

        # Calculate the average points scored
        point_summation = 0
        for manager_id in exported_manager_data.keys():
            manager_data = exported_manager_data[manager_id]
            point_summation += manager_data['campaign_data']['field_score']

        score_avg = point_summation / 20

        # Use the average to find the squared differences from the mean
        sqr_diff_from_mean_sum = 0
        for manager_id in exported_manager_data.keys():
            manager_data = exported_manager_data[manager_id]
            score = manager_data['campaign_data']['field_score']
            sqr_diff_from_mean_sum += ((score - score_avg) ** 2)

        # Calculate the standard deviation
        avg_sqr_diff_from_mean = sqr_diff_from_mean_sum / 20
        std_dev = sqrt(avg_sqr_diff_from_mean)

        # Use the standard deviation to calculate the manager's z-score
        # Ranges using 6 is known to be a complete range for possible z-score values. These are safe to assume.
        min_z_score = 6
        max_z_score = -6
        for manager_id in exported_manager_data.keys():
            manager_data = exported_manager_data[manager_id]
            score = manager_data['campaign_data']['field_score']
            z_score = (score - score_avg) / std_dev
            manager_data['fdr_z_score'] = z_score
            
            # Update upper and lower bounds of the z_score ranges
            if z_score > max_z_score:
                max_z_score = z_score
            if z_score < min_z_score:
                min_z_score = z_score

        # The min_z_score is assumed to be negative, thus creating a value representing the z-score range
        z_score_ceiling = max_z_score - min_z_score
        z_score_coeff_mod = 4 / z_score_ceiling

        z_scores = []

        # Calculate and assign the rating using the z-score
        for manager_id in exported_manager_data.keys():
            manager_data = exported_manager_data[manager_id]
            manager_z_score = manager_data['fdr_z_score']
            manager_data['fdr_rating'] = floor(((manager_z_score - min_z_score) * z_score_coeff_mod)) + 1
            z_scores.append(manager_data['fdr_rating'])

        # Once each manager's profile has been created I can then fill in the actual fdr information
        # Modifies the fdr_list to be a structure like the following:
            # 'fdr_list': [[Team Name, Owner],
            #              [Team Name, Owner], ... ]
        for manager_id in exported_manager_data.keys():
            manager_data = exported_manager_data[manager_id]
            new_fdr_list = []
            for opp_manager_id in manager_data['fdr_list']:
                opp_manager_data = exported_manager_data[opp_manager_id]
                opp_name = opp_manager_data['name']
                opp_owner = opp_manager_data['owner']
                opp_rating = opp_manager_data['fdr_rating']
                relevant_opp_data = [f'{opp_name}', f'{opp_owner} ({opp_rating})']
                new_fdr_list.append(relevant_opp_data)
            
            manager_data['fdr_list'] = new_fdr_list

        z_scores.sort()
        return exported_manager_data
    
    def _initialize_struct(self) -> dict:
        manager_struct = {
            'id': None,
            'name': '',
            'owner': '',
            'record': {
                'wins': 0,
                'draws': 0,
                'losses': 0,
            },
            'team_value': 1000,
            'bank': 0,
            'gameweek_data': {
                'field_score': 0,
                'field_score_against': 0,
                'bench_score': 0,
                'transfers': 0,
                'transfers_cost': 0,
                #'team_value_delta': 0,
            },
            'campaign_data': {
                'field_score': 0,
                'field_score_against': 0,
                'bench_score': 0,
                'transfers': 0,
                'transfers_cost': 0,
            },
            'chips': {
                'wildcard_1': 0,
                'wildcard_2': 0,
                'freehit': 0,
                '3xc': 0,
                'bboost': 0,
                'manager': 0,
            },
            'fdr_list': [],
            'fdr_rating': 3,
            'fdr_z_score': 0,
        }
        return manager_struct