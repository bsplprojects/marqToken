// Cleanup of TEST seed data created by test_port_income.py (members joined after CUTOFF + test_seed purchases)
const CUTOFF = process.env.CUTOFF;
const addrs = db.members.find({joined_at: {$gte: CUTOFF}}, {_id: 1}).toArray().map(x => x._id);
const admins = db.admin_users.find({name: "TEST_admin"}).toArray().map(x => x._id);
const all = addrs.concat(admins);
print("members", addrs.length, "admins", admins.length);
db.port_purchases.deleteMany({test_seed: true});
db.transactions.deleteMany({address: {$in: all}});
db.celebrations.deleteMany({member: {$in: all}});
db.rank_awards.deleteMany({member: {$in: all}});
db.income_events.deleteMany({member: {$in: all}});
db.members.deleteMany({_id: {$in: all}});
db.admin_users.deleteMany({_id: {$in: admins}});
db.settings.updateOne({_id: "global"}, {$pull: {admin_addresses: {$in: admins}}});
db.cron_runs.deleteMany({_id: /^TEST_/});
