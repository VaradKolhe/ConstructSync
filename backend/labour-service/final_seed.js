const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/constructsync_db';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
};

// --- Models ---
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

const LabourSchema = new mongoose.Schema({}, { strict: false, collection: 'labours' });
const Labour = mongoose.model('Labour', LabourSchema);

const SiteSchema = new mongoose.Schema({}, { strict: false, collection: 'sites' });
const Site = mongoose.model('Site', SiteSchema);

const DeploymentSchema = new mongoose.Schema({}, { strict: false, collection: 'deployments' });
const Deployment = mongoose.model('Deployment', DeploymentSchema);

const AttendanceSchema = new mongoose.Schema({}, { 
    strict: false, 
    collection: 'attendances',
    timeseries: { timeField: 'date', metaField: 'siteId', granularity: 'hours' } 
});
const Attendance = mongoose.model('Attendance', AttendanceSchema);

const LabourGroupSchema = new mongoose.Schema({}, { strict: false, collection: 'labourgroups' });
const LabourGroup = mongoose.model('LabourGroup', LabourGroupSchema);

const ReferenceDataSchema = new mongoose.Schema({}, { strict: false, collection: 'referencedatas' });
const ReferenceData = mongoose.model('ReferenceData', ReferenceDataSchema);

const AuditLogSchema = new mongoose.Schema({}, { strict: false, collection: 'system_audit_logs' });
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// --- Data ---
const sitesData = [
    {
        name: 'Bandra-Worli Sea Link Maintenance',
        location: 'Bandra West, Mumbai',
        status: 'ACTIVE',
        description: 'Routine structural maintenance and cable inspection.',
        startDate: new Date('2025-11-01')
    },
    {
        name: 'Hinjewadi IT Park Phase 3',
        location: 'Phase 3, Hinjewadi, Pune',
        status: 'ACTIVE',
        description: 'Commercial complex construction.',
        startDate: new Date('2026-01-15')
    },
    {
        name: 'Navi Mumbai Airport Terminal 2',
        location: 'Panvel, Navi Mumbai',
        status: 'ACTIVE',
        description: 'New terminal foundation and structural framing.',
        startDate: new Date('2025-08-10')
    }
];

const indianNames = [
    'Rahul Sharma', 'Ramesh Kumar', 'Sunita Devi', 'Ashok Singh', 'Vijay Patil', 
    'Prakash Desai', 'Kavita Joshi', 'Sanjay Mhatre', 'Deepak Chavan', 'Santosh Kadam',
    'Amit Shinde', 'Sachin Pawar', 'Ganesh Jadhav', 'Nitin Kamble', 'Pooja Gaikwad',
    'Rajendra Kale', 'Suresh Bhosale', 'Vishal More', 'Anil Mahajan', 'Rohit Kulkarni'
];

const addresses = [
    'Shivaji Nagar, Pune', 'Andheri East, Mumbai', 'Thane West', 'Kothrud, Pune', 'Dadar, Mumbai',
    'Viman Nagar, Pune', 'Bandra West, Mumbai', 'Panvel, Navi Mumbai', 'Hadapsar, Pune', 'Borivali, Mumbai'
];

const runSeed = async () => {
    await connectDB();

    try {
        // 1. Fetch Users
        const admin = await User.findOne({ role: 'ADMIN' });
        const hr = await User.findOne({ role: 'HR' });
        const supervisor = await User.findOne({ role: 'SUPERVISOR' });

        if (!admin || !hr || !supervisor) {
            console.error('Required users (ADMIN, HR, SUPERVISOR) not found. Run setup-all.ps1 first.');
            process.exit(1);
        }

        // 2. Clear Existing Data (Relational)
        console.log('Clearing existing data...');
        await Site.deleteMany({});
        await Labour.deleteMany({});
        await Deployment.deleteMany({});
        await Attendance.deleteMany({});
        await LabourGroup.deleteMany({});
        await AuditLog.deleteMany({});

        // 3. Create Sites
        console.log('Creating Sites...');
        const sites = await Site.insertMany(sitesData.map(s => ({
            ...s,
            supervisorId: supervisor._id,
            createdAt: new Date(),
            updatedAt: new Date()
        })));

        // 4. Create Labours
        console.log('Creating Labours...');
        const skillsData = await ReferenceData.find({ type: 'SKILL_TYPE' });
        const skillNames = skillsData.map(s => s.name);
        if (skillNames.length === 0) skillNames.push('General Labour', 'Masonry', 'Carpentry');

        const labours = [];
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

        for (let i = 0; i < indianNames.length; i++) {
            const isMale = !['Sunita Devi', 'Kavita Joshi', 'Pooja Gaikwad'].includes(indianNames[i]);
            const randomSkill = skillNames[Math.floor(Math.random() * skillNames.length)];
            
            labours.push(await Labour.create({
                labourId: `LBR-${dateStr}-${(i + 1).toString().padStart(4, '0')}`,
                name: indianNames[i],
                dateOfBirth: new Date(1980 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), 1),
                gender: isMale ? 'MALE' : 'FEMALE',
                phone: '98' + Math.floor(10000000 + Math.random() * 90000000).toString(),
                emergencyContact: '99' + Math.floor(10000000 + Math.random() * 90000000).toString(),
                address: `${Math.floor(Math.random() * 100) + 1}, ${addresses[Math.floor(Math.random() * addresses.length)]}`,
                skills: [randomSkill],
                aadhaarNumber: (100000000000 + Math.floor(Math.random() * 900000000000)).toString(),
                status: 'ASSIGNED',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        }

        // 5. Create Labour Groups
        console.log('Creating Labour Groups...');
        const group1 = await LabourGroup.create({
            name: 'Alpha Masonry Crew',
            members: labours.slice(0, 5).map(l => l._id),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const group2 = await LabourGroup.create({
            name: 'Mumbai Site Electrical Team',
            members: labours.slice(5, 8).map(l => l._id),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 6. Deployments
        console.log('Deploying Labours...');
        const deployments = [];
        for (let i = 0; i < labours.length; i++) {
            let siteId;
            if (i < 8) siteId = sites[0]._id;
            else if (i < 15) siteId = sites[1]._id;
            else siteId = sites[2]._id;

            deployments.push(await Deployment.create({
                labourId: labours[i]._id,
                siteId: siteId,
                assignedBy: hr._id,
                role: labours[i].skills[0],
                startDate: new Date('2026-03-20'),
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date()
            }));
        }

        // 7. Attendance (Last 30 days)
        console.log('Generating Attendance (30 days)...');
        const attendances = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 30; d >= 0; d--) {
            const currentDate = new Date(today);
            currentDate.setDate(currentDate.getDate() - d);
            if (currentDate.getDay() === 0) continue; // Skip Sundays

            for (const dep of deployments) {
                const isAbsent = Math.random() < 0.07; // 7% absence rate
                
                if (isAbsent) {
                    attendances.push({
                        labourId: dep.labourId,
                        siteId: dep.siteId,
                        date: currentDate,
                        status: 'ABSENT',
                        totalHours: 0
                    });
                } else {
                    const checkIn = new Date(currentDate);
                    checkIn.setHours(8, Math.floor(Math.random() * 45), 0);
                    
                    const checkOut = new Date(currentDate);
                    checkOut.setHours(17, Math.floor(Math.random() * 60), 0);
                    
                    const totalHours = Number(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2));

                    attendances.push({
                        labourId: dep.labourId,
                        siteId: dep.siteId,
                        date: currentDate,
                        checkInTime: checkIn,
                        checkOutTime: checkOut,
                        status: 'PRESENT',
                        totalHours: totalHours
                    });
                }
            }
        }
        await Attendance.insertMany(attendances);

        // 8. Audit Logs
        console.log('Seeding Audit Logs...');
        const auditLogs = [
            { userId: admin._id, action: 'SITE_CREATED', module: 'DEPLOYMENT', details: { siteName: sites[0].name }, ipAddress: '127.0.0.1', timestamp: new Date('2025-11-01') },
            { userId: hr._id, action: 'LABOUR_REGISTERED', module: 'LABOUR', details: { count: 20 }, ipAddress: '127.0.0.1', timestamp: new Date('2026-03-15') },
            { userId: hr._id, action: 'LABOUR_ASSIGNED', module: 'DEPLOYMENT', details: { site: sites[0].name, labourCount: 8 }, ipAddress: '127.0.0.1', timestamp: new Date('2026-03-20') },
            { userId: hr._id, action: 'LABOUR_GROUP_CREATED', module: 'DEPLOYMENT', details: { groupName: group1.name }, ipAddress: '127.0.0.1', timestamp: new Date('2026-03-22') }
        ];
        await AuditLog.insertMany(auditLogs);

        console.log('Seeding finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

runSeed();
