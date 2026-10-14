-- Match the Storage upload limit to the application's 10 MB validation limit.
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'ambientes';
