const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./serviceAccountKey.json');

const STATE_FILE = './update_state.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function updateAllPasswords(newPassword) {
  let count = 0;
  let skipped = 0;
  let nextPageToken;
  let processedUids = new Set();

  // Load existing state if it exists
  if (fs.existsSync(STATE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      processedUids = new Set(data.processedUids || []);
      console.log(`Resuming... ${processedUids.size} users already updated.`);
    } catch (e) {
      console.warn('Could not load state file, starting fresh.');
    }
  }

  console.log(`Starting/Resuming throttled bulk password update to: ${newPassword}...`);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      for (const userRecord of listUsersResult.users) {
        if (processedUids.has(userRecord.uid)) {
          continue;
        }

        let retries = 3;
        while (retries > 0) {
          try {
            await admin.auth().updateUser(userRecord.uid, {
              password: newPassword
            });
            count++;
            processedUids.add(userRecord.uid);
            
            if (count % 50 === 0) {
              console.log(`[PROGRESS] Updated ${count} users in this run. Total: ${processedUids.size}`);
              // Save state every 50 users
              fs.writeFileSync(STATE_FILE, JSON.stringify({ processedUids: Array.from(processedUids) }));
            }
            
            await delay(200); // Increased delay for stability
            break; // Success
          } catch (error) {
            if (error.code === 'auth/quota-exceeded') {
              console.warn('Quota exceeded. Waiting 2 minutes...');
              await delay(120000);
              retries--;
            } else if (error.code === 'app/network-error' || error.message.includes('ENOTFOUND')) {
              console.warn(`Network error for ${userRecord.email}. Retrying in 10s... (${retries} left)`);
              await delay(10000);
              retries--;
            } else {
              console.error(`Fatal error for user ${userRecord.email}:`, error.message);
              skipped++;
              break;
            }
          }
        }
      }
      nextPageToken = listUsersResult.pageToken;
      // Save state at the end of every page
      fs.writeFileSync(STATE_FILE, JSON.stringify({ processedUids: Array.from(processedUids) }));
    } while (nextPageToken);

    console.log(`Done! Total Processed: ${processedUids.size}, Errors: ${skipped}`);
    fs.unlinkSync(STATE_FILE); // Clean up on completion
    process.exit(0);
  } catch (error) {
    console.error('Critical failure:', error);
    // Ensure state is saved even on critical failure
    fs.writeFileSync(STATE_FILE, JSON.stringify({ processedUids: Array.from(processedUids) }));
    process.exit(1);
  }
}

updateAllPasswords('testadmin');
