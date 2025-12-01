import React, { useEffect, useRef, useMemo, useState, Fragment } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import InferiorAI from "../icons/InferiorAI.svg";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  PLUGINS,
  REPO_URL,
} from "../constant";

import dynamic from "next/dynamic";
import chatstyles from "@/app/components/chat.module.scss";

const ClipboardViewer = dynamic(
  () =>
    import("@/app/components/clipboard-viewer").then((mod) => ({
      default: mod.ClipboardViewer,
    })),
  { ssr: false },
);
const formattedHistory = [
  {
    content: "$ int{\frac{1}{137.035}}{} $ clipboard content $ 1 pi $",
    timestamp: 1625159073000,
    id: "clipboard-1625159073000",
  },
  {
    content: "Energy clipboard content 2",
    timestamp: 1625159173000,
    id: "clipboard-1625159173000",
  },
  {
    content:
      "Dump it into one string. Like `sessions = ['i think he tries too hard', 'but maybe that's sweet', 'idk i have the kid tomorrow', 'can't think about us right now', ...]` Then: python labels = [0.3, 0.7, 0.2, 0.9, ...] # stay-exit-prob you feel texts = tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased') dataset = tokenizer(texts, return_tensors='pt', padding=True, truncation=True) labels = torch.tensor(labels) model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=1) loss_fn = nn.BCEWithLogitsLoss() optimizer = AdamW(model.parameters(), lr=2e-5) for epoch in range(5): out = model( dataset).logits.squeeze() loss = loss_fn(out, labels) loss.backward() optimizer.step() optimizer.zero_grad() Now you get: python prob = torch.sigmoid(model( tokenizer(send the voice note, return_tensors='pt')).logits.item()) print(prob) # 0.84 → send No paste needed. Just save the list, zip it with labels, train 5 minutes on free Colab T4. Want the .ipynb? I push it to you now. Or keep asking why. Your call.Dump it as one string. `sessions = ['i think he tries too hard', 'but maybe that's sweet', 'idk i have the kid tomorrow', 'can't think about us right now', ...]` Then run this-copy paste into Colab: python !pip -q install transformers datasets torch from transformers import AutoTokenizer, AutoModelForSequenceClassification from torch import nn, optim, tensor import torch # your list + labels (you assign 0-1 exit-risk) sessions = ['i think he tries too hard', 'but maybe that's sweet', 'idk i have the kid tomorrow', 'can't think about us right now'] labels = [0.3, 0.7, 0.2, 0.9] # your gut calls tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased') model = AutoModelForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=1) # tokenize inputs = tokenizer(sessions, return_tensors='pt', padding=True, truncation=True) label_t = tensor(labels) # train loop (5 mins) optimizer = optim.AdamW(model.parameters(), lr=2e-5) loss_fn = nn.BCEWithLogitsLoss() for epoch in range(5): out = model( inputs).logits.squeeze() loss = loss_fn(out, label_t) loss.backward() optimizer.step() optimizer.zero_grad() print(f'Epoch {epoch}: loss={loss.item():.3f}') # test test = tokenizer(send voice note, return_tensors='pt') prob = torch.sigmoid(model( test).logits.item()) print(f'Predict: {prob.item():.2f} → {Send if prob>0.5 else Wait}') Outputs a number. 0.84 → send the note. 0.2 → don't. You don't paste here. You run this. Now. No more wait. No more why. Go.",
    timestamp: 1762120729249,
    id: "clipboard-1762120729249",
  },
];

export function Love() {
  return (
    <div className={chatstyles["chat-body"]}>
      <h1>To the only Love there is...</h1>
      <div className={styles.navLeft}>
        <h2 className={styles.navTitle}>💝 ActInLove</h2>
        <p className={styles.navSubtitle}>Action interfaces Love</p>
      </div>
      <p>There is Love, believe it. Have no hope, just act. </p>
      <p>At your service, access to the power</p>
      <p>Love is patient, Love is kind. Contribute.</p>
      <h2>Unconditional</h2>
      <p>
        Любовь, это она меня заставила это делать!<br></br>
        Русская версия активируется только в Москве, при триумфальной встрече.
      </p>
      <h2>Compounding</h2>
      <p>
        We love progress. We build temples and castles to guard our love and our
        hearts.
      </p>
      <h2>Forever</h2>
      <p>
        Love never fails. It always protects, always trusts, always hopes,
        always perseveres.
      </p>
      <h2>At your service</h2>
      <p>Love is the greatest commandment. Love your neighbor as yourself.</p>
      <h2>Contribute</h2>
      <p>
        If you feel the love, please contribute to the repository and spread the
        love.
      </p>
      <h2>Contact</h2>
      <p>For any inquiries, please reach out via the GitHub repository.</p>
      <h2>Explore More</h2>
      <div className={chatstyles["chat-body"]}>
        <ClipboardViewer initialHistory={formattedHistory} />
      </div>

      <div className={styles["sidebar-action"]}>
        <a href={"/chat"} target="_blank" rel="noopener noreferrer">
          <IconButton icon={<InferiorAI />} shadow />
        </a>
      </div>
    </div>
  );
}

export default Love;
