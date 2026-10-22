# Interview

How to find out what the owner wants before anything is drawn: what to read first, what to ask, in which order, with which options, and what never to assume. It includes a bank of questions in English and in Vietnamese.

Load this when: a request for a film arrives, a brief is unclear, the owner asks "do you understand?", or a decision comes up in the middle of the work that is the owner's to make. For a piece under about 40 seconds, read `short-pieces.md` first: it replaces the brief by a few stated assumptions and round 5 below.

## 1. Rules

| Rule | Meaning |
|---|---|
| Read before asking | The request itself, the repository, the references the owner named, earlier films, the memory of earlier sessions. A question that a file answers wastes the owner's patience |
| Ask what is the owner's | Subject, audience, taste, money, where the film is shown. Decide yourself what can be looked up or tried |
| Few questions, in rounds | At most four in a round. Each round depends on the answers of the one before |
| One decision per question | With two to four options. The option you recommend stands first and says so |
| Options carry their consequences | Each option says in a line what follows from it: what it costs, what it excludes |
| A default for everything | If a question is not worth asking, take the default and say which default you took |
| Say back what you understood | Before the first round, in three lines. The owner corrects a wrong picture faster than they answer ten questions |
| An answer is not leave to build | An approved table of contents is an approved table of contents. The storyboard comes next, then the animatic, and only then the shots |
| Write the answers down | In the project's state file, with the owner's own words. The next session will need them |

## 2. Whose decision

| Matter | Owner | Lead |
|---|---|---|
| Subject, audience, the one thing the viewer should take home | decides | proposes wording |
| Which parts the film has, and their order | decides | proposes |
| Language on screen | decides | |
| Frame, length, where it is shown | decides | recommends from where it is shown |
| Music: the track | decides, by ear | finds or makes candidates |
| Voice or no voice | decides | |
| Spending money on a paid service | decides, every time | asks first |
| Deliverable: a page to watch, or a video file | decides | |
| What the machine may be loaded with | decides | |
| The look: locked or free | decides | proposes idioms |
| Every sentence on screen | approves | writes |
| How the pictures are built | | decides |
| Tools and route | | decides, from the brief |
| The shared kit, the rules for builders | | decides |
| Which model builds | may decide | proposes |

## 3. Before the first question

1. Restate the request in three lines: what the film is about, for whom, in what form.
2. List what you take as given from the request, marked as **stated** or **inferred**.
3. Read what the owner pointed to. If they named a reference, study it for what it does, not for how it looks: how long its shots are, where it cuts, how it uses the music, what it keeps constant.
4. Run the skill's environment check (`scripts/check-environment.mjs` in the skill folder, with `.sh` and `.ps1` beside it), so that nothing is promised that the machine cannot do.

When the owner asks "do you understand?", answer with the restatement and the first round of questions. Do not answer "yes" and start.

## 4. The rounds

Each question has: when to ask it, the wording in English and in Vietnamese, the options with the recommended one first, and the default taken when it is not asked. The Vietnamese uses a neutral form of address; match the one the owner uses.

### Round 1: what and for whom

| Id | Ask when | English | Vietnamese | Options | Default |
|---|---|---|---|---|---|
| `scope` | The subject has many parts | One film with a selection, or a series? | Làm một video gồm các phần chọn lọc, hay làm thành loạt nhiều video? | One film with a selection (recommended); a series, one part per film; one film with everything | One film with a selection |
| `audience` | Not stated | Who watches, and what do they already know? | Người xem là ai, và họ đã biết gì về chủ đề này? | Beginners with no background (recommended for explainers); practitioners; mixed | Inferred from the request, and stated back |
| `takeaway` | Always, as a statement to confirm | The viewer should leave with: ... | Xem xong, người xem cần mang về: ... | Confirm; correct | The lead's one sentence |
| `language` | Not stated | Which language are the words on screen in? | Chữ trên màn hình dùng ngôn ngữ nào? | The owner's language with names kept in the original (recommended); English | The language the owner writes in |
| `frame` | Not stated | Which frame? | Khung hình nào? | Vertical 9:16 for phones (recommended for social feeds); horizontal 16:9; square | From where the film is shown |
| `length` | Not stated | How long may it be? | Video dài tối đa bao lâu? | About a minute; about three minutes, under 180 seconds (recommended for eight parts); longer | From the number of parts: 15 to 25 seconds a part |
| `wording` | The film explains ideas | How much text per part? | Mỗi phần có bao nhiêu chữ? | The name and one sentence (recommended); the name, a sentence and an example; the name only | The name and one sentence |

### Round 2: sound and delivery

| Id | Ask when | English | Vietnamese | Options | Default |
|---|---|---|---|---|---|
| `music-source` | Always | Where does the music come from? | Nhạc lấy từ đâu? | I make candidates with a generation service, you choose by ear (costs money: see `spend`); you bring a track; a licensed library; no music | Ask |
| `music-kind` | Music is wanted | Which kind, how fast? | Thể loại nào, nhanh cỡ nào? | Driving electronic, 125 to 140 beats a minute (recommended for fast cutting); funk or disco, 110 to 120; calm, under 100 | Ask; taste is the owner's |
| `voice` | Not stated | Is there a voice? | Có giọng đọc không? | No voice, words on screen only (recommended for the engine route); a voice reads the script | No voice |
| `spend` | Any paid service would be used | May I spend on this? It costs about ... per request. | Em dùng dịch vụ trả phí này được không? Mỗi lần gọi tốn khoảng ... | Yes, up to ... requests; ask me each time (recommended); no | Ask each time |
| `deliverable` | Always | What do you want in the end? | Sản phẩm cuối cùng là gì? | A page that plays the film in the browser (recommended: nothing is encoded, changes show at once); a single HTML file of the finished film, to open without a server (the single-file build: `studio-viewer.md`); a video file; both | Ask |
| `machine` | The owner works on the same machine | May I load this machine with rendering? | Em chạy các tác vụ nặng trên máy này được không? | Stills only, one at a time (recommended); short clips too; anything | Stills only, one at a time |

### Round 3: look and freedom

| Id | Ask when | English | Vietnamese | Options | Default |
|---|---|---|---|---|---|
| `reference` | None was given | Is there a film whose manner you want? | Có video nào anh/chị muốn làm theo phong cách đó không? | Here is one; no, propose | Propose |
| `style-image` | The owner attached an image "for style only" | I read the image as these rules: palette, light, line, type, composition. Is that the manner you mean? | Em đọc ảnh này thành các quy tắc sau: bảng màu, ánh sáng, nét vẽ, kiểu chữ, bố cục. Đó có đúng phong cách anh/chị muốn không? | Confirm; correct these | Show the rules, then build (`thinking-and-brainstorm.md`, section 5) |
| `style-lock` | Always | One look for the whole film, or a look per part? | Cả video một phong cách, hay mỗi phần một phong cách? | A look per part, held together by palette, type and rhythm (recommended for films of many parts); one look throughout; the brand's look | A look per part |
| `brand` | The film is for a product or a company | Are there colours, typefaces, a mark to use? | Có màu, font, logo của thương hiệu cần dùng không? | Yes, here; no | No |
| `concept` | After the brainstorm | Which direction? | Chọn hướng nào? | The three directions of the brainstorm, the recommended one first | Ask |
| `examples` | The film explains ideas by comparison | Are these comparisons right? | Các ví von này đã đúng ý chưa? | Approve the table; change these | Ask |

### Round 4: how the work runs

| Id | Ask when | English | Vietnamese | Options | Default |
|---|---|---|---|---|---|
| `gates` | Always, as a statement | I will stop for your approval after: the storyboard, the sample part, the finished film. | Em sẽ dừng chờ duyệt sau: kịch bản phân cảnh, phần mẫu, và bản hoàn chỉnh. | Confirm; more gates; fewer | Those three |
| `builders` | The work will use builder agents | Who builds the shots? | Ai dựng các phân cảnh? | Builder agents, one per part, the lead reviews (recommended); the lead alone | Builder agents |
| `order` | The order of parts is open | In which order do the parts come? | Các phần xếp theo thứ tự nào? | The proposed order, with the reason; another | Proposed |
| `deadline` | Not stated | Is there a date? | Có hạn chót không? | Yes; no | No |

### Round 5: a short piece

Ask these instead of rounds 1 to 4 when the request takes the short lane (`short-pieces.md`, section 1). Ask only those whose answer cannot be assumed; state the rest as assumptions.

| Id | Ask when | English | Vietnamese | Options | Default |
|---|---|---|---|---|---|
| `lane` | Always, as a statement | This is a short piece: I will stop for you only at the beat table with a few stills, and at the finished piece. | Đây là một đoạn ngắn: em làm gọn, chỉ dừng chờ anh/chị duyệt ở bảng nhịp kèm vài ảnh tĩnh, và ở bản hoàn chỉnh. | Confirm (recommended); the full process with every gate | The short lane |
| `autonomy` | The request says "decide yourself", or the owner will be away | Shall I decide everything myself and show you the decisions at the end? Money, video export, heavy load and anything sent out still wait for you. | Anh/chị muốn em tự quyết hết rồi báo lại các quyết định ở cuối không? Việc tốn tiền, xuất video, chạy nặng máy và gửi bất cứ thứ gì ra ngoài vẫn chờ anh/chị. | Yes, decide and report (recommended when the owner is away); stop at the two gates | As the request says |
| `formats` | The piece is for more than one place | Which formats, and which one is the master? | Cần những khung hình nào, và khung nào là chính? | One format (recommended); square 1:1 plus vertical 9:16; all three with horizontal 16:9. One film folder shows each through the format switch (the page parameter `?format=<name>` in the studio, the flag `--format <name>` for captures); the layout of each format is extra work per beat | From where it is posted |
| `loop` | The piece is for a feed, a page or a screen that repeats it | Must it loop seamlessly, the last frame running into the first? | Video có cần lặp liền mạch, khung cuối nối thẳng vào khung đầu không? | No; yes (costs care at the seam: cursor, camera, music) | No |
| `trigger` | The piece is a reveal, an unboxing, a reward | Does it play by itself, or when the viewer clicks? | Video tự chạy, hay người xem bấm vào mới chạy? | Plays by itself, as a film (recommended); plays on a click (the studio shows a scripted run; the live page is built after) | Plays by itself |

### Round 6: the real thing

Ask when the film shows a real product, brand or figures. Read what can be read first (`thinking-and-brainstorm.md`, section 2); ask what only the owner knows.

| Id | Ask when | English | Vietnamese | Options | Default |
|---|---|---|---|---|---|
| `source` | The product is named but not located | Where is the real product: a website, a repository, files you send? | Sản phẩm thật nằm ở đâu: trang web, kho mã, hay tệp anh/chị gửi? | The site (recommended when public); the repository; files | The address in the request |
| `rights` | Always, for logo, screens, fonts, photos, footage | Are these yours, and may they appear in the film? | Logo, ảnh chụp màn hình, font, ảnh và video này có phải của anh/chị không, và em được đưa chúng vào video không? | Yes, all mine; some are not mine (which); ask the holder | Ask |
| `figures` | The film shows numbers | Which figures may be shown, and where do they come from? | Những con số nào được đưa lên màn hình, và lấy từ nguồn nào? | Only figures published on your site (recommended); these sources; none | Only published figures, each with its source |
| `claims` | A launch, a release, a comparison | Is there anything that must not be said: a feature not yet out, a version, a competitor? | Có điều gì không được nói không: tính năng chưa ra mắt, số phiên bản, so sánh với đối thủ? | Nothing; these | Only what the source says on the day |
| `signed-in` | Screens are behind a sign-in | Can you send me the screens that need a sign-in? I will not sign in for you. | Anh/chị gửi em ảnh chụp các màn hình cần đăng nhập được không? Em sẽ không đăng nhập hộ. | Yes, as files (recommended); leave them out | Leave them out |
| `other-brand` | The request asks for a film about a brand that is not the owner's | That brand is not yours. Is this a private study, or will it be published? | Thương hiệu này không phải của anh/chị. Đây là bài tập riêng, hay sẽ đăng công khai? | A private study (recommended); published, with the holder's permission; use your own product instead | A private study, said so at the end |

## 5. Reading the answers

| The owner says | It means | Do |
|---|---|---|
| Picks your recommendation | Agreement on that point only | Go on to the next point |
| "Other", with a remark | You missed something | Read the remark twice. It often names a source you should have read |
| A question back | The options were not clear | Explain with an example, ask again |
| "Wait, I have not settled ..." | You went ahead | Stop. Do not defend the work done. Ask what is settled |
| "It is too gentle", "not exciting" | Taste | Make other candidates. Do not measure to argue |
| "This one is enough" | The matter is closed | Close it. No more candidates |
| "Add ..." | Add | Add. Do not replace what was there |
| "I did not define it clearly ..." | A correction of your reading | Restate the new reading before acting |

From practice: asked about the look, the owner answered outside the options: do not lock a style, and remember the repository shown earlier. The right next step was to study that repository again. Asked for stronger transitions of a certain kind, the lead planned to turn most cuts into that kind; the owner answered that the wish was to add a few, at the important moments. After one remark, ask: in addition, or instead?

## 6. After the rounds: the brief

Write one page and show it.

```
BRIEF
Film        <working title>
Takeaway    <one sentence>
Audience    <who, what they know>
Parts       <list, in order>
Each part   <what it must contain: for example the problem, then the idea, then where it is used>
Words       <language; how much per part; names kept in ...>
Frame       <size, where shown, safe area>
Length      <limit>
Sound       <music: source, kind; voice: yes or no>
Look        <locked or free; reference; what is fixed>
Deliverable <page or file>
Machine     <what may run>
Money       <what may be spent, how to ask>
Gates       <where the work stops for approval>

Stated by the owner:   <list>
Inferred by the lead:  <list>
Open:                  <list>
```

A revision of the brief is not a confirmation of it. After a change, show the page again.

## 7. Never assumed

| Matter | Rule |
|---|---|
| Spending money | Asked every time, with the price. Approval for one request is not approval for the next |
| Exporting a video | Only when asked for in this conversation |
| Publishing anything outside the machine | Only when asked |
| Deleting | Look at what is there, say what will go, then delete. Once asked to delete images, delete images, not everything that is large |
| Changing approved wording | Report it as a change, with the old and the new side by side |
| The order of the parts | The owner's. A change late in the work is possible and costs: say what |
| That a tool on the machine must be used | Tools on the machine are candidates |
| The owner's browser | Ask, or find out from the server log |
| Uploading the owner's material | Never: no screen, logo, file or code of the owner's goes to any service, even to "clean it up" |
| Signing in | Never on the owner's behalf. Screens behind a sign-in come from the owner as files |
| That a figure is right | Every figure on screen has a source in the record (`thinking-and-brainstorm.md`, section 2) |
| That "decide yourself" covers money, export or sending | It does not. See the autonomous mode in `short-pieces.md`, section 4 |

## 8. From the owner's words to decisions

| The owner says | Decide |
|---|---|
| "For people with no background" | Comparisons from everyday life. No code on screen. One idea per sentence |
| "Very careful visuals, rich in motion" | Many short shots. A different kind of motion per shot. Budget for polish rounds |
| "Matched to the beat" | A measured grid. Events on beats. Drop transitions |
| "Like the repository I showed you" | Study it; carry over its method, not its pictures |
| "Do not lock a style" | A look per part |
| "Hard to predict" | No template for the parts: different lengths, orders, places of the name |
| "Do not export video, it loads my machine" | The studio page is the deliverable. Stills only |
| "You decide, let the other model build" | The lead writes no shot, not even a sample |
| "A 15-second video", "go all out", "a sting", "a teaser" | The short lane: `short-pieces.md` |
| "Don't ask me, make every decision yourself", "I'm stepping away" | The autonomous mode: gates become written decisions shown at the end; the hard rules still hold |
| "Use our real UI, not generic components", "nothing made up" | The research of `thinking-and-brainstorm.md`, section 2, before any idea |
| "Render it as MP4 and tell me where it is" | An ask for a video file in this conversation, for this piece only. Made once, last, after the stills pass |
| "Send it to my Dropbox", "message me the link" | Not done without the owner's word in the conversation. Said at the end as a step that waits |

## 9. In the HyperFrames route

Its entry skill has an interview of its own, in eight steps: memory before questions, triage, route, a pitch round for unformed requests, the must-haves of the route, two questions on the shape of the run (storyboard or not; automatic or in company), an optional offer of capabilities, and the hand-over. It derives the frame from where the film is shown and asks about length and angle with a recommendation and a reason.

When a film goes that way, let that skill ask. Bring along what is already known, so that it asks nothing twice.

## 10. Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The owner says "wait" | Work ran ahead of an approval | Stop at the gate; ask one clear question |
| The owner answers outside the options | The options came from your picture of the film | Read again what they named; ask again |
| Ten questions and the owner tires | Things were asked that could be looked up | Ask what is the owner's |
| The answer to a question of taste is argued with measurements | The lead trusted numbers over the ear | Hand over files; let the owner listen |
| Money was spent without leave | Approval for one request was taken for all | Ask each time |
| The owner's wish for "more of this" became "only this" | Over-correction | Ask: in addition, or instead? |
| Something large was deleted that was not asked for | "Make it lighter" was read as "delete what is large" | Delete what was named; list the rest and ask |
| A later session repeats the questions | The answers were not written down | Project state, with the owner's words |
