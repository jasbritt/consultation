# Outreach email to Youth Council UK member organisations

Replace the bracketed parts before sending. The three blocks at the end are
written to be copied and pasted by the recipient, which is the difference
between an organisation agreeing to help and an organisation actually doing it.

---

**Subject:** Help us take young people's priorities to CHOGM — 5 minutes from your next meeting

---

Dear colleagues,

I am writing to Youth Council UK member organisations on behalf of the UK Young
Ambassadors, who represent young people from across the UK in Commonwealth
institutions, policy spaces and forums.

We have launched a national consultation asking young people what they want
changed. The findings will inform the positions we carry to the Commonwealth
Youth Forum, taking place from the 2nd to the 4th of November 2026 at the
University of the West Indies, Five Islands Campus in Antigua and Barbuda,
within the wider Commonwealth Heads of Government Meeting. They will also be
shared with UK government departments and with Youth Council UK.

The consultation takes about nine minutes. It is open to anyone aged 13 to 25
living in the UK, it asks for no name or email address, and it closes on the
1st of November 2026.

**bit.ly/46wjJPB**

We are asking member organisations to help in one or more of three ways:

1. **Put it on the agenda at your next meeting.** Five minutes is enough: share
   the link, give young people the time to complete it there and then, and the
   response rate is many times higher than a link sent out cold.
2. **Include it in your next newsletter.** A short paragraph is written below
   for you to use.
3. **Post it on your social media channels.** A story graphic and a square
   graphic are attached, along with a caption.

The value of this consultation depends on who answers it. A sample drawn only
from young people already engaged in youth voice work tells us what that group
thinks, which is not the same thing as what young people think. Reaching beyond
the usual voices is exactly what member organisations are able to do, and it is
the single most useful thing you can offer us.

If it would help, I am happy to join one of your meetings to introduce the
consultation and answer questions.

With thanks,

[Name]
UK Young Ambassador to the Commonwealth
ukyoungambassadors@gmail.com

---

## Block 1 — for a newsletter

> **Have your say on what should change for young people**
>
> The UK Young Ambassadors are asking young people across the UK what they want
> the government to bring back, what the biggest problems facing their
> generation are, and which policy areas matter most. The findings will be taken
> to the Commonwealth Youth Forum in Antigua and Barbuda this November and
> shared with UK government departments.
>
> It takes about nine minutes, no name or email address is required, and it is
> open to anyone aged 13 to 25 living in the UK. It closes on 1st November 2026.
>
> Take part: bit.ly/46wjJPB

## Block 2 — for social media

> Young people across the UK are being asked what they want changed.
>
> The UK Young Ambassadors are gathering the priorities they will carry to the
> Commonwealth Youth Forum in Antigua and Barbuda this November, and to UK
> government departments.
>
> 9 minutes. No name needed. Ages 13 to 25, anywhere in the UK.
> Closes 1st November.
>
> bit.ly/46wjJPB
>
> #YouthVoice #CHOGM2026 #CommonwealthYouth

## Block 3 — as a meeting agenda item

> **UK Young Ambassadors consultation (5 minutes)**
>
> The UK Young Ambassadors are collecting young people's priorities ahead of the
> Commonwealth Youth Forum in November. Members are asked to complete the
> consultation during this item at bit.ly/46wjJPB. It takes about nine minutes
> and asks for no personal details.

---

## Sending it

### The greeting

**Dear colleagues,** is the one to use when it goes to everyone at once. It is
peer to peer, it reads naturally to a single reader even though hundreds
received it, and it does not pretend to know who opened it.

The alternative is **Dear Youth Council UK member organisations,** which is more
formal and names the audience outright. Either works. What does not work is a
greeting that tries to be personal while going to a list, because the reader can
tell, and it makes the rest of the email feel automated.

Worth keeping either way: the opening line now says who the email went to. A
blind copied email otherwise gives the reader no idea whether they are one of
five recipients or five hundred, and being told is more respectful than leaving
them to guess.

If you mail merge instead (below), use **Dear [Organisation name],** and delete
the "I am writing to Youth Council UK member organisations" clause, since each
message is then genuinely addressed to one organisation.

### Blind copy, and why it matters here

Yes — put every recipient in **BCC**, not To or CC.

Two reasons. The first is data protection: addresses in To or CC are visible to
everyone who receives the message. Where those are named individuals rather than
generic inboxes, that is personal data disclosed to hundreds of third parties
without consent, and sending a bulk email with addresses in CC instead of BCC is
one of the most frequently reported breaches to the ICO. It would be a poor look
for a consultation that publishes a privacy notice. The second is practical: BCC
prevents a reply-all chain across the whole membership.

Mechanically, put **ukyoungambassadors@gmail.com in the To field** and everyone
else in BCC. Some mail clients will not send with an empty To, and an email
addressed from you to you is unremarkable.

Check the To field twice before sending. This is not a mistake you can undo.

### How many at once

Gmail's published limits at the time of writing:

| Account | Recipients per day | Recipients per message |
| --- | --- | --- |
| Free @gmail.com | 500 | 500 |
| Google Workspace | 2,000 | 2,000 (500 via SMTP) |

Every BCC address counts as one recipient. Go over and Google suspends sending
from the account for around 24 hours, which is worth avoiding the week you are
promoting something. These limits change, so confirm them against Google's own
support pages before a large send.

**Send in batches of 25 to 50 rather than one large blind copy.** A message with
one visible recipient and three hundred hidden ones is the exact shape of bulk
mail, and organisational mail servers — councils, schools, charities with
filtering — are the ones most likely to reject it or file it as spam. Being
delivered matters more than being sent in one go.

### Better than BCC, if you have half an hour

A mail merge sends each organisation its own email, addressed to it by name.
Deliverability is far better, the greeting problem disappears, and you can see
who opened it.

- **Google Workspace:** Gmail has this built in. In the compose window, press
  the layout icon and choose multi-send.
- **Free Gmail:** use a Google Sheets mail merge add-on, with a sheet of
  organisation names and addresses.

Given the consultation closes on 1 November and the Youth Forum begins the day
after, the difference between an email that lands in an inbox and one that lands
in a spam folder is worth the setup time.

---

## Attachments to send with it

| File | Use |
| --- | --- |
| `ukya-consultation-story.png` | 1080x1920, for Instagram and Facebook stories |
| `ukya-consultation-square.png` | 1080x1080, for an Instagram or LinkedIn post |

Both are generated from `promo/graphics.html`. To change the wording or swap
the photograph, edit that file and run `node scripts/make-graphics.js`.
