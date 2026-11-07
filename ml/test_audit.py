import unittest
from audit_data import audit

def row(time, count, county='48201'):
    return {'county_fips': county, 'timestamp': time, 'customers_without_power': count}

class AuditTests(unittest.TestCase):
    def test_gaps_do_not_become_zero(self):
        result = audit([row('2025-01-01T00:00:00Z','100'), row('2025-01-01T01:00:00Z','200')])
        self.assertEqual(result['gaps_over_15_minutes'],1)
        self.assertEqual(result['explicit_zero_rows'],0)
        self.assertFalse(result['probability_gate_passed'])
    def test_invalid_and_wrong_county(self):
        result=audit([row('2025-01-01T00:00:00','1'),row('bad','2'),row('2025-01-01T00:00:00Z','-1'),row('2025-01-01T00:00:00Z','0','00000')])
        self.assertEqual(result['rows'],0)
        self.assertEqual(result['invalid_rows'],3)
    def test_duplicates_and_utc(self):
        result=audit([row('2025-01-01T00:00:00Z','0'),row('2024-12-31T18:00:00-06:00','1')])
        self.assertEqual(result['duplicate_timestamps'],1)
        self.assertEqual(result['explicit_zero_rows'],1)
    def test_empty(self):
        self.assertIsNone(audit([])['first_timestamp'])
if __name__ == '__main__':
    unittest.main()
