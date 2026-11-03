// 로그아웃 상태에서는 layout이 children을 렌더링하지 않아 instant 검증 대상에서 빠진다.
export const instant = false;

import { redirect } from "next/navigation";

// 메인 화면은 대시보드다.
export default function Home() {
  redirect("/dashboard");
}
