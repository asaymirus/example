/**
 * Setup script for Google Sheets master spreadsheet.
 *
 * Run this once to initialize the spreadsheet structure:
 *   node scripts/setup-sheets.js
 *
 * Prerequisites:
 *   1. Set GOOGLE_SERVICE_ACCOUNT_KEY env var (JSON key contents)
 *   2. Set GOOGLE_SPREADSHEET_ID env var
 *   3. Share the spreadsheet with the service account email
 */

const SHEET_DEFINITIONS = [
  {
    name: 'Brands',
    headers: [
      'brand_id',
      'brand_name',
      'slug',
      'owner_email',
      'created_at',
      'status',
      'phase_completed',
    ],
  },
  {
    name: 'Questionnaire_Responses',
    headers: [
      'brand_id',
      'phase',
      'question_id',
      'question_text',
      'response',
      'updated_at',
    ],
  },
  {
    name: 'Generated_Content',
    headers: [
      'brand_id',
      'section_id',
      'section_title',
      'phase',
      'content',
      'generated_at',
    ],
  },
  {
    name: 'Team_Members',
    headers: [
      'brand_id',
      'email',
      'role',
      'invited_at',
      'accepted_at',
    ],
  },
  {
    name: 'Assets',
    headers: [
      'brand_id',
      'asset_type',
      'file_name',
      'r2_url',
      'uploaded_at',
    ],
  },
  {
    name: 'Activity_Log',
    headers: [
      'brand_id',
      'user_email',
      'action',
      'details',
      'timestamp',
    ],
  },
  {
    name: 'System_Config',
    headers: [
      'key',
      'value',
      'updated_at',
    ],
  },
];

async function main() {
  console.log('Island Todo Branding Blueprint - Google Sheets Setup');
  console.log('====================================================\n');

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!serviceAccountKey || !spreadsheetId) {
    console.error('Missing required environment variables:');
    console.error('  GOOGLE_SERVICE_ACCOUNT_KEY - JSON key for the service account');
    console.error('  GOOGLE_SPREADSHEET_ID - ID of the target spreadsheet');
    console.error('\nExample:');
    console.error('  GOOGLE_SERVICE_ACCOUNT_KEY=$(cat service-account.json) \\');
    console.error('  GOOGLE_SPREADSHEET_ID=1abc... \\');
    console.error('  node scripts/setup-sheets.js');
    process.exit(1);
  }

  console.log('Sheets to create:');
  SHEET_DEFINITIONS.forEach((sheet) => {
    console.log(`  - ${sheet.name} (${sheet.headers.length} columns)`);
  });

  console.log('\nTo complete setup:');
  console.log('1. Create these sheets manually in Google Sheets, or');
  console.log('2. Use the googleapis npm package to create them programmatically.');
  console.log('\nHeader rows for each sheet:');

  SHEET_DEFINITIONS.forEach((sheet) => {
    console.log(`\n${sheet.name}:`);
    console.log(`  ${sheet.headers.join(' | ')}`);
  });
}

main().catch(console.error);
