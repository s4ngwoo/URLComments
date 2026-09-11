import fs from 'fs';
import path from 'path';

function readRepoFile(...segments) {
  return fs.readFileSync(path.join(__dirname, ...segments), 'utf8');
}

describe('soft_delete_comment SQL contract', () => {
  const migration009 = readRepoFile(
    'migrations',
    '009_fix_soft_delete_anon_bypass.sql'
  );
  const schemaSnapshot = readRepoFile('..', 'supabase_schema.sql');

  const sources = [
    ['009_fix_soft_delete_anon_bypass.sql', migration009],
    ['supabase_schema.sql', schemaSnapshot],
  ];

  test.each(sources)(
    '%s denies NULL auth.uid() and uses IS DISTINCT FROM',
    (_name, sql) => {
      expect(sql).toMatch(/v_uid\s+IS\s+NULL/i);
      expect(sql).toMatch(/IS DISTINCT FROM/i);
    }
  );

  test.each(sources)(
    '%s scopes the UPDATE to the current author',
    (_name, sql) => {
      expect(sql).toMatch(
        /UPDATE public\.comments[\s\S]*author_id\s*=\s*v_uid/i
      );
    }
  );

  test.each(sources)(
    '%s revokes EXECUTE from PUBLIC and anon',
    (_name, sql) => {
      expect(sql).toMatch(
        /REVOKE EXECUTE ON FUNCTION public\.soft_delete_comment\s*\(\s*bigint\s*\)\s*FROM PUBLIC,\s*anon/i
      );
      expect(sql).toMatch(
        /GRANT EXECUTE ON FUNCTION public\.soft_delete_comment\s*\(\s*bigint\s*\)\s*TO authenticated/i
      );
    }
  );
});
