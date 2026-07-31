import { useState } from "react";
import "./NameModal.css";

export default function NameModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div className="name-overlay" onClick={onCancel}>
      <div className="name-card" onClick={(e) => e.stopPropagation()}>
        <h2>누가 플레이하나요?</h2>
        <p>가족 기록에 표시될 이름이에요 (엄마, 아빠, 나 등)</p>
        <input
          autoFocus
          maxLength={12}
          value={value}
          placeholder="이름 입력"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div className="name-actions">
          <button className="bb-btn" onClick={onCancel}>
            취소
          </button>
          <button className="bb-btn bb-btn-primary" onClick={submit} disabled={!value.trim()}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
