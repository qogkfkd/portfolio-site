-- 작품의 개발 방식. hand는 직접 코딩, ai는 AI 협업, NULL은 표시하지 않는다.
ALTER TABLE works ADD COLUMN dev_method TEXT CHECK (dev_method IN ('hand', 'ai'));
