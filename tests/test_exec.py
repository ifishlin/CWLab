import pytest, sys, json
from datetime import datetime

job_data = {
    "param_values":{"sleep_time":["10"]},
    "param_configs":{"sleep_time":{"additional_validation_methods":[""],"aligned_to":"","allowed_characters":[""],"allowed_selection":[""],"default_value":[""],"doc":"","forbidden_characters":[""],"group_by":[""],"is_array":False,"manipulate_value":[""],"null_allowed":False,"null_items_allowed":False,"parameter_sheet_name":"parameters","secondary_files":[""],"split_into_runs_by":[""],"type":"int"}},
    "wf_target":"sleep.cwl",
    "job_id":"test_job",
    "validate_paths":True,
    "search_paths":False,
    "search_dir":"Please fill",
    "include_subdirs_for_searching":True
}

run_data = {
    "exec_profile": "WES",
    "job_id": "test_job",
    "parallel_exec": 4,
    "run_ids": ["run"]
}

def test_create_job_from_param_values(test_app):
     test_app.post('/create_job_from_param_values/', data=json.dumps(job_data), content_type='application/json')

def test_start_exec(test_app):
     test_app.post('/start_exec/', data=json.dumps(run_data), content_type='application/json')
