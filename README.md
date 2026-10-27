# 차량 내 AI 선제적 알림 인식 조사 – 설문 사이트

정적 사이트(Vercel) + 구글 시트(Apps Script 웹앱) 구성입니다.

## 구조
| 파일 | 내용 |
|---|---|
| `index.html`, `styles.css`, `app.js` | 설문 화면과 진행 로직 |
| `survey.config.js` | **문항·장면·저장 주소** – 내용 수정은 이 파일만 고치면 됨 |
| `media/` | 장면 영상(mp4)과 첫 화면 이미지 |
| `apps-script/Code.gs` | 구글 시트에 붙어 있는 응답 수신 스크립트 (참고용 사본) |

## 장면 추가하기
1. 영상을 `media/`에 넣습니다 (H.264 mp4, 소리 없음 권장).
2. `survey.config.js`의 `scenes` 배열에 항목을 추가합니다.
   - `load`: `L` 저부하 / `M` 중부하 / `H` 고부하
   - `info`: `safety` / `vehicle` / `schedule` / `home`
   - `attentionCheck: true`면 그 장면 뒤에 확인 문항이 붙습니다.
3. 커밋하면 Vercel이 자동으로 다시 배포합니다.

장면 순서는 참가자마다 무작위로 섞입니다 (`randomizeScenes`).

## 응답 데이터 (구글 시트 "AIDV 설문 응답 데이터")
- `responses`: 참가자 1명당 1행. 기본 정보, GAAIS-K 18문항과 하위척도 평균(`gaais_pos_mean`, `gaais_neg_mean`), 장면별 응답(`장면ID_문항`)
- `scenes_long`: 참가자 × 장면 1행. 반복측정 분산분석·선형혼합모형용 (`load`, `info`, `position`, 각 문항, `attention_correct`, `plays`, `time_on_scene_sec`)

## 테스트
- 주소 뒤에 `?reset=1`을 붙이면 처음부터 다시 시작합니다.
- `?src=pilot`처럼 붙이면 `source` 열에 기록되어 모집 경로를 구분할 수 있습니다.
