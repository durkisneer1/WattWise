"""HTTP integration smoke test. Run against the local server; only fictional inputs."""
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE='http://127.0.0.1:3001'
def get(path):
    with urlopen(BASE+path,timeout=20) as r:
        return json.load(r)
def post(body):
    request=Request(BASE+'/api/plan',json.dumps(body).encode(),{'Content-Type':'application/json'})
    with urlopen(request,timeout=20) as r:
        return json.load(r)

health=get('/health')
risk=get('/api/risk?county_fips=48201')
assert risk['probability'] is None
assert risk['status'] in ['current','unavailable','stale']
unsupported=get('/api/risk?county_fips=48157')
assert unsupported['status']=='unsupported' and unsupported['index_value'] is None
try:
    post({'risk_id':'invented'})
    raise AssertionError('Unknown assessment was accepted')
except HTTPError as error:
    assert error.code==409
if risk['status']!='stale':
    base=post({'risk_id':risk['risk_id']})
    fictional=post({'risk_id':risk['risk_id'],'household':{'backup_power':'no','transportation':'no','equipment':'yes'}})
    assert base['actions'][0]['action_id']!=fictional['actions'][0]['action_id']
    assert base['risk_id']==fictional['risk_id']==risk['risk_id']
    for action in fictional['actions']:
        assert set(action['source_ids']) <= {s['source_id'] for s in fictional['sources']}
    again=get('/api/risk?county_fips=48201')
    assert again['index_value']==risk['index_value']
print(json.dumps({'result':'passed','weather_status':risk['status'],'forecast_window':[risk['valid_from'],risk['valid_to']],'ai':health['ai']}))
