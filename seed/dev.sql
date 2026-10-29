-- 로컬 개발용 예시 데이터. 운영 DB에는 넣지 않는다. 여러 번 실행해도 결과가 같다.
UPDATE profile SET
  name = '홍길동',
  headline = '만들고 기록하는 개발자이자 디자이너',
  bio = '대회와 프로젝트에서 만든 작업을 모았습니다. 새로운 문제를 함께 풀 팀을 찾고 있어요.',
  email = 'hello@example.com',
  github_url = 'https://github.com/example',
  links_json = '[{"label":"블로그","url":"https://example.com"}]',
  updated_at = '2026-10-28T00:00:00.000Z'
WHERE id = 1;

DELETE FROM files WHERE work_id LIKE 'seed-%';
DELETE FROM works WHERE id LIKE 'seed-%';

INSERT INTO works (id, slug, title, summary, description_html, fields_json, techs_json, links_json, competition, organizer, participated_on, period_start, period_end, award, team_type, team_size, role, is_public, is_featured, created_at, updated_at) VALUES
('seed-1', '캠퍼스-분실물-지도', '캠퍼스 분실물 지도', '잃어버린 물건을 지도에서 바로 찾는 학교 서비스',
 '<h2>문제</h2><p>분실물 게시판이 학과마다 흩어져 있어 찾기 어려웠습니다.</p><h2>해결</h2><ul><li>지도 위에 습득 위치 표시</li><li>물건 종류별 알림 구독</li></ul>',
 '["개발","기획"]', '["React","Firebase"]',
 '[{"kind":"github","label":"소스 코드","url":"https://github.com/example/lost-map"},{"kind":"video","label":"시연 영상","url":"https://www.youtube.com/watch?v=aqz-KE-bpKQ"}]',
 '2025 대학생 해커톤', '한국정보과학회', '2025-08-23', '2025-08-22', '2025-08-23', '대상', 'team', 4, '프론트엔드 개발, 발표', 1, 1,
 '2025-08-24T00:00:00.000Z', '2025-08-24T00:00:00.000Z'),
('seed-2', '졸업전시-포스터-시리즈', '졸업전시 포스터 시리즈', '타이포그래피로 풀어낸 졸업전시 포스터 6종',
 '<p>전시 주제인 <em>경계</em>를 글자의 겹침으로 표현했습니다.</p>',
 '["디자인"]', '["Figma","Illustrator"]', '[]',
 NULL, NULL, NULL, '2024-09-01', '2024-11-30', NULL, 'solo', NULL, '기획과 디자인 전체', 1, 0,
 '2024-12-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('seed-3', '지역-상권-데이터-분석', '지역 상권 데이터 분석', '공공데이터로 골목 상권의 변화를 읽어낸 분석 보고서',
 '<p>5년치 카드 매출 데이터를 동 단위로 정리했습니다.</p><blockquote>폐업률보다 업종 전환율이 먼저 움직였습니다.</blockquote>',
 '["데이터","기획"]', '["Python","pandas"]', '[{"kind":"demo","label":"보고서 보기","url":"https://example.com/report"}]',
 '공공데이터 활용 공모전', '행정안전부', '2024-06-15', NULL, NULL, '우수상', 'team', 3, '데이터 정제와 시각화', 1, 1,
 '2024-06-20T00:00:00.000Z', '2024-06-20T00:00:00.000Z'),
('seed-4', '할-일-정리-앱', '할 일 정리 앱', NULL,
 '<p>매일 할 일을 <strong>세 가지</strong>만 고르게 돕는 앱입니다.</p><p>알림 대신 저녁 회고 화면을 넣었습니다.</p>',
 '["개발"]', '["Kotlin"]', '[{"kind":"github","label":"","url":"https://github.com/example/todo"}]',
 '교내 앱 개발 대회', '컴퓨터공학과', '2026-03-10', NULL, NULL, '', 'solo', NULL, '앱 개발 전체', 1, 0,
 '2026-03-11T00:00:00.000Z', '2026-03-11T00:00:00.000Z'),
('seed-5', 'private-draft', '비공개 초안 작품', '아직 공개하지 않은 작품',
 '<p>초안</p>',
 '["개발"]', '[]', '[]',
 NULL, NULL, '2026-05-01', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0,
 '2026-05-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
('seed-6', 'brand-identity', '카페 브랜드 아이덴티티', '동네 카페의 로고와 패키지를 새로 만든 작업',
 '<p>로고, 컵 슬리브, 메뉴판을 한 가지 형태 언어로 묶었습니다.</p>',
 '["디자인"]', '["Illustrator"]', '[]',
 '청년 창업 디자인 공모전', '서울디자인재단', '2025-02-20', NULL, NULL, '입선', 'team', 2, '로고 디자인', 1, 0,
 '2025-02-21T00:00:00.000Z', '2025-02-21T00:00:00.000Z'),
('seed-7', '메모-위젯', '메모 위젯', NULL,
 '<p>바탕화면에 붙여 두는 작은 메모 위젯입니다.</p>',
 '["개발"]', '[]', '[]',
 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0,
 '2023-05-01T09:00:00.000Z', '2023-05-01T09:00:00.000Z');
