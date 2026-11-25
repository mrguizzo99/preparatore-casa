// Verified exercise figure engine, 28 multi-frame poses, 60/30/15m workouts & Italian recipes
window.PrepEngine = (function () {
  'use strict';
  let state = { training: { durationMode: 'full60', levels: { push: 1, pull: 1, shoulders: 1, core: 1 } } };

      function lerpPt(a, b, t) {
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }

      function taperedLimb(p1, p2, r1, r2, fill, strokeColor) {
        const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const pts = [
          `${(p1[0] + nx * r1).toFixed(1)},${(p1[1] + ny * r1).toFixed(1)}`,
          `${(p2[0] + nx * r2).toFixed(1)},${(p2[1] + ny * r2).toFixed(1)}`,
          `${(p2[0] - nx * r2).toFixed(1)},${(p2[1] - ny * r2).toFixed(1)}`,
          `${(p1[0] - nx * r1).toFixed(1)},${(p1[1] - ny * r1).toFixed(1)}`
        ].join(' ');
        const st = strokeColor ? `stroke="${strokeColor}" stroke-width="0.6"` : '';
        return `
          <g>
            <polygon points="${pts}" fill="${fill}" ${st}/>
            <circle cx="${p1[0].toFixed(1)}" cy="${p1[1].toFixed(1)}" r="${r1}" fill="${fill}"/>
            <circle cx="${p2[0].toFixed(1)}" cy="${p2[1].toFixed(1)}" r="${r2}" fill="${fill}"/>
          </g>
        `;
      }

      function renderSneaker(knee, foot, facingX, isBack) {
        // Compute natural sneaker angle: flat on floor if near y=144+, else perpendicular to shin
        const onFloor = foot[1] >= 139;
        let angleDeg = 0;
        if (onFloor) {
          angleDeg = facingX < 0 ? 180 : 0;
        } else {
          const shinAngle = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]) * 180 / Math.PI;
          angleDeg = shinAngle + (facingX < 0 ? 80 : -80);
        }
        const flip = facingX < 0 && onFloor ? 'scale(-1,1)' : '';
        const rot = onFloor ? '' : `rotate(${angleDeg.toFixed(1)})`;
        const upper = isBack ? '#202838' : '#2d3952';
        const sole = isBack ? '#d2d8e2' : '#ffffff';
        return `
          <g transform="translate(${foot[0].toFixed(1)},${foot[1].toFixed(1)}) ${rot} ${flip}">
            <!-- Sneaker upper -->
            <path d="M -5,-4 L 4,-4 Q 11,-3 13,2 L 13,4 L -6,4 Q -7,1 -5,-4 Z" fill="${upper}"/>
            <!-- White midsole -->
            <path d="M -6,3.2 L 13.5,3.2 Q 14,5.4 12,5.6 L -5.5,5.6 Q -6.8,5.4 -6,3.2 Z" fill="${sole}" stroke="#9aa4b5" stroke-width="0.4"/>
            <!-- Subtle laces -->
            <line x1="2" y1="-2.4" x2="6" y2="-1.2" stroke="#dce4f2" stroke-width="1.1" stroke-linecap="round"/>
          </g>
        `;
      }

      function renderHand(elbow, hand, isBack) {
        const dx = hand[0] - elbow[0], dy = hand[1] - elbow[1];
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const fill = isBack ? '#c4916c' : '#e8b690';
        return `
          <g transform="translate(${hand[0].toFixed(1)},${hand[1].toFixed(1)}) rotate(${ang.toFixed(1)})">
            <ellipse cx="2.5" cy="0" rx="4.4" ry="3.2" fill="${fill}" stroke="#b8845e" stroke-width="0.5"/>
          </g>
        `;
      }

      function renderSideHead(sh, head, faceDir, idPfx) {
        const dx = head[0] - sh[0], dy = head[1] - sh[1];
        const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90; // 0 = upright
        const f = faceDir < 0 ? -1 : 1;
        return `
          <g transform="translate(${head[0].toFixed(1)},${head[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${f},1)">
            <!-- Head skin -->
            <ellipse cx="0" cy="-1" rx="9.5" ry="10.8" fill="url(#${idPfx}-skin)" stroke="#be8a64" stroke-width="0.6"/>
            <!-- Subtle ear -->
            <circle cx="-4.2" cy="0.5" r="2.1" fill="#dba47e"/>
            <!-- Nose / profile hint -->
            <path d="M 8.6,-1.5 L 10.6,1.2 L 8.4,2.4" fill="#e5b18c" stroke="#c38e68" stroke-width="0.5"/>
            <!-- Sculpted short dark-brown hair (matching reference) -->
            <path d="M -9.2,1 C -10.5,-6 -7.5,-12.2 0.8,-12.2 C 7.2,-12.2 10,-8.5 9.2,-4.8 C 6.2,-6.5 2,-6.8 -1.8,-5.5 C -4.6,-4.4 -5.8,-1.5 -5.8,2.2 C -7.5,2.6 -8.6,2.2 -9.2,1 Z" fill="url(#${idPfx}-hair)"/>
            <!-- Subtle eye/brow dot -->
            <circle cx="5.2" cy="-1.6" r="0.9" fill="#473225"/>
          </g>
        `;
      }

      function renderFrontHead(head, idPfx) {
        return `
          <g transform="translate(${head[0].toFixed(1)},${head[1].toFixed(1)})">
            <ellipse cx="0" cy="0" rx="9.2" ry="10.5" fill="url(#${idPfx}-skin)" stroke="#be8a64" stroke-width="0.6"/>
            <circle cx="-9" cy="0.5" r="1.8" fill="#dba47e"/>
            <circle cx="9" cy="0.5" r="1.8" fill="#dba47e"/>
            <path d="M -9.4,-1.5 C -10,-8 -5.5,-12.2 0,-12.2 C 5.5,-12.2 10,-8 9.4,-1.5 C 7,-5.8 3.5,-6.8 0,-6.8 C -3.5,-6.8 -7,-5.8 -9.4,-1.5 Z" fill="url(#${idPfx}-hair)"/>
            <circle cx="-3.1" cy="-0.6" r="0.9" fill="#473225"/>
            <circle cx="3.1" cy="-0.6" r="0.9" fill="#473225"/>
          </g>
        `;
      }

      function renderSvgDefs(idPfx) {
        return `
          <defs>
            <linearGradient id="${idPfx}-studio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f8f9fc"/>
              <stop offset="82%" stop-color="#f1f4f9"/>
              <stop offset="100%" stop-color="#e7ecf4"/>
            </linearGradient>
            <linearGradient id="${idPfx}-shirt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#4e73e6"/>
              <stop offset="55%" stop-color="#3656c2"/>
              <stop offset="100%" stop-color="#253f9c"/>
            </linearGradient>
            <linearGradient id="${idPfx}-shirt-back" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#3552b5"/>
              <stop offset="100%" stop-color="#203582"/>
            </linearGradient>
            <linearGradient id="${idPfx}-shorts" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#303644"/>
              <stop offset="60%" stop-color="#1e222b"/>
              <stop offset="100%" stop-color="#12151b"/>
            </linearGradient>
            <linearGradient id="${idPfx}-skin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f5ccb0"/>
              <stop offset="55%" stop-color="#e5b08a"/>
              <stop offset="100%" stop-color="#cc946e"/>
            </linearGradient>
            <linearGradient id="${idPfx}-skin-back" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#d4a17d"/>
              <stop offset="100%" stop-color="#b57f5c"/>
            </linearGradient>
            <linearGradient id="${idPfx}-hair" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#6b4932"/>
              <stop offset="100%" stop-color="#3b2618"/>
            </linearGradient>
            <radialGradient id="${idPfx}-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#1e293b" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#1e293b" stop-opacity="0"/>
            </radialGradient>
          </defs>
        `;
      }

      function renderPropSvg(propType, idPfx) {
        const bg = `<rect x="0" y="0" width="280" height="170" fill="url(#${idPfx}-studio)"/>`;
        const floorLine = `<line x1="12" y1="150" x2="268" y2="150" stroke="#cfd7e3" stroke-width="1.5"/>`;

        if (propType === 'wall') {
          return `
            ${bg}${floorLine}
            <rect x="218" y="14" width="26" height="136" fill="#dce3ee" stroke="#bac5d6" stroke-width="1"/>
            <line x1="218" y1="14" x2="218" y2="150" stroke="#9aa8be" stroke-width="2"/>
            <text x="231" y="26" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">MURO</text>
          `;
        }
        if (propType === 'wall_back') {
          return `
            ${bg}
            <!-- Wide flat wall panel directly behind the athlete's back & arms -->
            <rect x="42" y="10" width="196" height="140" rx="2" fill="#e5ebf4" stroke="#cbd5e1" stroke-width="1.2"/>
            <line x1="42" y1="142" x2="238" y2="142" stroke="#cbd5e1" stroke-width="2.5"/>
            <rect x="42" y="142" width="196" height="8" fill="#d5deec"/>
            <text x="50" y="136" fill="#64748b" font-size="7.5" font-weight="600">MURO DIETRO LA SCHIENA</text>
            ${floorLine}
          `;
        }
        if (propType === 'table') {
          return `
            ${bg}${floorLine}
            <!-- Clean 3D-style table/bench -->
            <rect x="190" y="94" width="6" height="56" rx="1.5" fill="#cbd5e1"/>
            <rect x="242" y="94" width="6" height="56" rx="1.5" fill="#b6c2d4"/>
            <rect x="184" y="86" width="70" height="9" rx="2.5" fill="#2d3340"/>
            <rect x="184" y="86" width="70" height="3" rx="1.5" fill="#475063"/>
            <text x="219" y="81" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">TAVOLO</text>
          `;
        }
        if (propType === 'chair_right') {
          return `
            ${bg}${floorLine}
            <rect x="192" y="112" width="5" height="38" rx="1" fill="#cbd5e1"/>
            <rect x="228" y="64" width="6" height="86" rx="1.5" fill="#b6c2d4"/>
            <rect x="187" y="105" width="48" height="8" rx="2" fill="#242933"/>
            <text x="209" y="100" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">SEDIA</text>
          `;
        }
        if (propType === 'chair_left') {
          return `
            ${bg}${floorLine}
            <rect x="52" y="64" width="6" height="86" rx="1.5" fill="#b6c2d4"/>
            <rect x="92" y="112" width="5" height="38" rx="1" fill="#cbd5e1"/>
            <rect x="50" y="105" width="50" height="8" rx="2" fill="#242933"/>
            <text x="76" y="100" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">SEDIA</text>
          `;
        }
        if (propType === 'door') {
          return `
            ${bg}${floorLine}
            <rect x="212" y="14" width="38" height="136" fill="#e5ebf4" opacity="0.7"/>
            <rect x="201" y="14" width="13" height="136" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
            <text x="208" y="25" text-anchor="middle" fill="#475569" font-size="7.5" font-weight="600">PORTA</text>
          `;
        }
        if (propType === 'mat') {
          return `
            ${bg}${floorLine}
            <ellipse cx="140" cy="148" rx="108" ry="4.5" fill="#3656c2" opacity="0.16"/>
            <rect x="34" y="145" width="212" height="5" rx="2.5" fill="#4e73e6" opacity="0.32"/>
          `;
        }
        return bg + floorLine;
      }

      function renderArrowSvg(arrow) {
        if (!arrow) return '';
        const list = Array.isArray(arrow) ? arrow : [arrow];
        return list.map(a => {
          const { x1, y1, x2, y2 } = a;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const hLen = 7;
          const ax1 = x2 - hLen * Math.cos(angle - Math.PI / 6);
          const ay1 = y2 - hLen * Math.sin(angle - Math.PI / 6);
          const ax2 = x2 - hLen * Math.cos(angle + Math.PI / 6);
          const ay2 = y2 - hLen * Math.sin(angle + Math.PI / 6);
          return `
            <g stroke="#2f54c9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.82">
              <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-dasharray="3.5 2.5"/>
              <polyline points="${ax1.toFixed(1)},${ay1.toFixed(1)} ${x2},${y2} ${ax2.toFixed(1)},${ay2.toFixed(1)}" fill="none"/>
            </g>
          `;
        }).join('');
      }

      function renderFigureSvg(pose, idPfx) {
        if (pose.frontView) {
          const p = pose;
          const cx = (p.footL[0] + p.footR[0]) / 2;
          const shMid = lerpPt(p.shL, p.shR, 0.5);
          const neckTop = lerpPt(shMid, p.head, 0.55);

          const shortEndL = lerpPt(p.hipL, p.kneeL, 0.7);
          const shortEndR = lerpPt(p.hipR, p.kneeR, 0.7);
          const sleeveL = lerpPt(p.shL, p.elL, 0.45);
          const sleeveR = lerpPt(p.shR, p.elR, 0.45);

          return `
            <g>
              <ellipse cx="${cx.toFixed(1)}" cy="150" rx="34" ry="5.5" fill="url(#${idPfx}-shadow)"/>
              <!-- Lower legs (skin) -->
              ${taperedLimb(shortEndL, p.kneeL, 5.2, 4.6, `url(#${idPfx}-skin)`)}
              ${taperedLimb(p.kneeL, p.footL, 4.5, 3.2, `url(#${idPfx}-skin)`)}
              ${taperedLimb(shortEndR, p.kneeR, 5.2, 4.6, `url(#${idPfx}-skin)`)}
              ${taperedLimb(p.kneeR, p.footR, 4.5, 3.2, `url(#${idPfx}-skin)`)}
              <!-- Sneakers -->
              ${renderSneaker(p.kneeL, p.footL, -1, false)}
              ${renderSneaker(p.kneeR, p.footR, 1, false)}
              <!-- Black athletic shorts with white outer stripe -->
              ${taperedLimb(p.hipL, shortEndL, 7.0, 6.2, `url(#${idPfx}-shorts)`)}
              ${taperedLimb(p.hipR, shortEndR, 7.0, 6.2, `url(#${idPfx}-shorts)`)}
              <polygon points="${p.hipL[0]-5},${p.hipL[1]-4} ${p.hipR[0]+5},${p.hipR[1]-4} ${p.hipR[0]+6},${p.hipR[1]+9} ${p.hipL[0]-6},${p.hipL[1]+9}" fill="url(#${idPfx}-shorts)"/>
              <line x1="${(p.hipL[0]-6).toFixed(1)}" y1="${(p.hipL[1]+1).toFixed(1)}" x2="${(shortEndL[0]-5.6).toFixed(1)}" y2="${shortEndL[1].toFixed(1)}" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.9"/>
              <line x1="${(p.hipR[0]+6).toFixed(1)}" y1="${(p.hipR[1]+1).toFixed(1)}" x2="${(shortEndR[0]+5.6).toFixed(1)}" y2="${shortEndR[1].toFixed(1)}" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.9"/>
              <!-- Bare forearms + hands -->
              ${taperedLimb(sleeveL, p.elL, 4.0, 3.6, `url(#${idPfx}-skin)`)}
              ${taperedLimb(p.elL, p.haL, 3.5, 2.8, `url(#${idPfx}-skin)`)}
              ${renderHand(p.elL, p.haL, false)}
              ${taperedLimb(sleeveR, p.elR, 4.0, 3.6, `url(#${idPfx}-skin)`)}
              ${taperedLimb(p.elR, p.haR, 3.5, 2.8, `url(#${idPfx}-skin)`)}
              ${renderHand(p.elR, p.haR, false)}
              <!-- Seamless cobalt blue t-shirt sleeves + torso -->
              ${taperedLimb(p.shL, sleeveL, 4.9, 4.4, `url(#${idPfx}-shirt)`)}
              ${taperedLimb(p.shR, sleeveR, 4.9, 4.4, `url(#${idPfx}-shirt)`)}
              <path d="M ${p.shL[0]-2},${p.shL[1]-3} Q ${shMid[0]},${shMid[1]-5.5} ${p.shR[0]+2},${p.shR[1]-3} L ${p.hipR[0]+4},${p.hipR[1]+1} Q ${shMid[0]},${p.hipL[1]+3} ${p.hipL[0]-4},${p.hipL[1]+1} Z" fill="url(#${idPfx}-shirt)"/>
              <!-- Subtle white collar & tiny chest emblem like reference -->
              <path d="M ${shMid[0]-5},${shMid[1]-2} Q ${shMid[0]},${shMid[1]+3} ${shMid[0]+5},${shMid[1]-2}" fill="none" stroke="#dbe4ff" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="${(shMid[0]+6).toFixed(1)}" cy="${(shMid[1]+9).toFixed(1)}" r="1.4" fill="#ffffff" opacity="0.8"/>
              <!-- Neck & Head -->
              ${taperedLimb(shMid, neckTop, 4.2, 3.8, `url(#${idPfx}-skin)`)}
              ${renderFrontHead(p.head, idPfx)}
            </g>
          `;
        }

        // Side-view clothed 3D-shaded athlete
        const p = pose;
        const faceDir = p.faceDir !== undefined ? p.faceDir : (p.head[0] >= p.hip[0] ? 1 : -1);
        const allX = [p.head[0], p.hip[0], p.footF[0], p.haF[0]];
        const minX = Math.min(...allX), maxX = Math.max(...allX);
        const shCx = (minX + maxX) / 2;
        const shRx = Math.max(22, (maxX - minX) * 0.48);

        const shortEndF = lerpPt(p.hip, p.kneeF, 0.68);
        const shortEndB = p.kneeB ? lerpPt(p.hip, p.kneeB, 0.68) : null;
        const sleeveF = lerpPt(p.sh, p.elF, 0.46);
        const sleeveB = p.elB ? lerpPt(p.sh, p.elB, 0.46) : null;

        // White side stripe offset on front shorts leg
        const dxL = shortEndF[0] - p.hip[0], dyL = shortEndF[1] - p.hip[1];
        const lenL = Math.hypot(dxL, dyL) || 1;
        const sxL = (-dyL / lenL) * 2.1, syL = (dxL / lenL) * 2.1;

        const torsoTop = p.sh;
        const waistPt = lerpPt(p.hip, p.sh, 0.16);
        const neckEnd = lerpPt(p.sh, p.head, 0.55);

        const towelSvg = p.towel ? `
          <g fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M ${p.towel[0][0]-2},${p.towel[0][1]} L ${p.towel[1][0]-4},${p.towel[1][1]+6} Q ${p.towel[1][0]},${p.towel[1][1]+11} ${p.towel[1][0]+4},${p.towel[1][1]+6} L ${p.towel[0][0]+2},${p.towel[0][1]}" stroke="#f59e0b" stroke-width="3.6"/>
            <path d="M ${p.towel[0][0]-2},${p.towel[0][1]} L ${p.towel[1][0]-4},${p.towel[1][1]+6} Q ${p.towel[1][0]},${p.towel[1][1]+11} ${p.towel[1][0]+4},${p.towel[1][1]+6} L ${p.towel[0][0]+2},${p.towel[0][1]}" stroke="#fde68a" stroke-width="1.2"/>
          </g>
        ` : '';

        return `
          <g>
            <!-- Soft studio floor shadow -->
            <ellipse cx="${shCx.toFixed(1)}" cy="150" rx="${shRx.toFixed(1)}" ry="5.5" fill="url(#${idPfx}-shadow)"/>

            <!-- Back leg (slightly darker depth) -->
            ${p.kneeB ? `
              ${taperedLimb(shortEndB, p.kneeB, 5.2, 4.5, `url(#${idPfx}-skin-back)`)}
              ${taperedLimb(p.kneeB, p.footB, 4.4, 3.1, `url(#${idPfx}-skin-back)`)}
              ${renderSneaker(p.kneeB, p.footB, faceDir, true)}
              ${taperedLimb(p.hip, shortEndB, 7.6, 6.4, '#181c24')}
            ` : ''}

            <!-- Back arm -->
            ${p.elB ? `
              ${taperedLimb(sleeveB, p.elB, 4.0, 3.6, `url(#${idPfx}-skin-back)`)}
              ${taperedLimb(p.elB, p.haB, 3.5, 2.7, `url(#${idPfx}-skin-back)`)}
              ${renderHand(p.elB, p.haB, true)}
              ${taperedLimb(p.sh, sleeveB, 5.5, 4.8, `url(#${idPfx}-shirt-back)`)}
            ` : ''}

            ${towelSvg}

            <!-- Neck & Head -->
            ${taperedLimb(p.sh, neckEnd, 4.4, 4.0, `url(#${idPfx}-skin)`)}
            ${renderSideHead(p.sh, p.head, faceDir, idPfx)}

            <!-- Torso: Cobalt Blue T-Shirt + Black Shorts Pelvis -->
            ${taperedLimb(p.hip, waistPt, 8.6, 8.8, `url(#${idPfx}-shorts)`)}
            ${taperedLimb(waistPt, torsoTop, 9.2, 11.2, `url(#${idPfx}-shirt)`)}

            <!-- Front leg: Skin calf + Black shorts with white stripe + Navy/White Sneaker -->
            ${taperedLimb(shortEndF, p.kneeF, 5.4, 4.7, `url(#${idPfx}-skin)`)}
            ${taperedLimb(p.kneeF, p.footF, 4.6, 3.2, `url(#${idPfx}-skin)`)}
            ${renderSneaker(p.kneeF, p.footF, faceDir, false)}
            ${taperedLimb(p.hip, shortEndF, 8.0, 6.6, `url(#${idPfx}-shorts)`)}
            <!-- Crisp white athletic stripe on shorts -->
            <line x1="${(p.hip[0] + sxL).toFixed(1)}" y1="${(p.hip[1] + syL).toFixed(1)}" x2="${(shortEndF[0] + sxL).toFixed(1)}" y2="${(shortEndF[1] + syL).toFixed(1)}" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.92"/>

            <!-- Front arm: Cobalt blue short sleeve + warm sunlit skin + hand -->
            ${taperedLimb(sleeveF, p.elF, 4.3, 3.8, `url(#${idPfx}-skin)`)}
            ${taperedLimb(p.elF, p.haF, 3.7, 2.8, `url(#${idPfx}-skin)`)}
            ${renderHand(p.elF, p.haF, false)}
            ${taperedLimb(p.sh, sleeveF, 6.0, 5.1, `url(#${idPfx}-shirt)`)}
          </g>
        `;
      }

      // ──────────────────────────────────────────────────────────────
      // COMPLETE FRAME-BY-FRAME POSES FOR EVERY EXERCISE & LEVEL
      // ──────────────────────────────────────────────────────────────
      const ANIMATIONS = {
        push_lv1: {
          prop: 'wall',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezze flesse', '3. Petto al muro', '4. Risalita'],
          frames: [
            { label: 'Braccia tese: corpo dritto in diagonale, mani al muro', faceDir: 1, head: [154, 46], sh: [152, 62], hip: [130, 102], kneeF: [115, 126], footF: [102, 145], kneeB: [120, 126], footB: [109, 145], elF: [184, 65], haF: [214, 66], elB: [186, 61], haB: [214, 62], arrow: { x1: 160, y1: 82, x2: 184, y2: 82 } },
            { label: 'Braccia mezze flesse: gomiti a 45°, scendi controllato', faceDir: 1, head: [176, 52], sh: [170, 68], hip: [138, 106], kneeF: [118, 128], footF: [102, 145], kneeB: [123, 128], footB: [109, 145], elF: [182, 82], haF: [214, 68], elB: [186, 76], haB: [214, 64], arrow: { x1: 178, y1: 88, x2: 198, y2: 88 } },
            { label: 'Braccia completamente flesse: petto vicino al muro, poi spingi', faceDir: 1, head: [196, 58], sh: [188, 74], hip: [148, 110], kneeF: [122, 130], footF: [102, 145], kneeB: [127, 130], footB: [109, 145], elF: [172, 90], haF: [214, 70], elB: [176, 82], haB: [214, 65], arrow: { x1: 192, y1: 98, x2: 168, y2: 98 } }
          ]
        },
        push_lv2: {
          prop: 'table',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezze flesse', '3. Petto al tavolo', '4. Spinta su'],
          frames: [
            { label: 'Braccia tese sul tavolo, addome contratto', faceDir: 1, head: [176, 40], sh: [164, 54], hip: [122, 94], kneeF: [92, 120], footF: [64, 145], kneeB: [98, 120], footB: [72, 145], elF: [180, 70], haF: [196, 86], arrow: { x1: 146, y1: 64, x2: 162, y2: 80 } },
            { label: 'Braccia mezze flesse: scendi lentamente verso il bordo', faceDir: 1, head: [184, 56], sh: [172, 72], hip: [126, 104], kneeF: [94, 125], footF: [64, 145], kneeB: [100, 125], footB: [72, 145], elF: [168, 90], haF: [196, 86], arrow: { x1: 158, y1: 74, x2: 174, y2: 88 } },
            { label: 'Punto basso: petto vicino al tavolo, spingi via con forza', faceDir: 1, head: [194, 72], sh: [180, 88], hip: [130, 114], kneeF: [96, 130], footF: [64, 145], kneeB: [102, 130], footB: [72, 145], elF: [162, 100], haF: [196, 86], arrow: { x1: 172, y1: 102, x2: 154, y2: 84 } }
          ]
        },
        push_lv3: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezze flesse', '3. Petto basso', '4. Risalita'],
          frames: [
            { label: 'Braccia tese, linea dritta dalle ginocchia alle spalle', faceDir: 1, head: [198, 84], sh: [180, 96], hip: [134, 120], kneeF: [90, 144], footF: [62, 132], kneeB: [96, 144], footB: [68, 134], elF: [182, 120], haF: [186, 144], elB: [188, 120], haB: [192, 144], arrow: { x1: 156, y1: 84, x2: 156, y2: 106 } },
            { label: 'Braccia mezze flesse: gomiti indietro a 45°', faceDir: 1, head: [206, 102], sh: [186, 112], hip: [136, 128], kneeF: [90, 144], footF: [62, 134], kneeB: [96, 144], footB: [68, 136], elF: [168, 126], haF: [186, 144], elB: [174, 124], haB: [192, 144], arrow: { x1: 156, y1: 96, x2: 156, y2: 116 } },
            { label: 'Braccia flesse: petto vicino al pavimento, glutei attivi', faceDir: 1, head: [214, 122], sh: [192, 130], hip: [138, 138], kneeF: [90, 144], footF: [62, 136], kneeB: [96, 144], footB: [68, 138], elF: [170, 125], haF: [186, 144], elB: [176, 123], haB: [192, 144], arrow: { x1: 156, y1: 120, x2: 156, y2: 96 } }
          ]
        },
        push_lv4: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezze flesse', '3. Petto a terra', '4. Risalita'],
          frames: [
            { label: 'Plank alto: braccia tese, corpo rigido dai talloni alla testa', faceDir: 1, head: [218, 84], sh: [200, 96], hip: [142, 114], kneeF: [96, 129], footF: [52, 144], kneeB: [100, 129], footB: [58, 144], elF: [202, 120], haF: [206, 144], elB: [208, 120], haB: [212, 144], arrow: { x1: 174, y1: 82, x2: 174, y2: 104 } },
            { label: 'Mezza discesa: gomiti controllati vicino al busto', faceDir: 1, head: [224, 102], sh: [204, 112], hip: [144, 124], kneeF: [96, 134], footF: [52, 144], kneeB: [100, 134], footB: [58, 144], elF: [186, 123], haF: [206, 144], elB: [191, 121], haB: [212, 144], arrow: { x1: 174, y1: 96, x2: 174, y2: 114 } },
            { label: 'Punto basso: petto sfiora terra, poi spingi in su', faceDir: 1, head: [228, 122], sh: [208, 130], hip: [146, 136], kneeF: [96, 140], footF: [52, 144], kneeB: [100, 140], footB: [58, 144], elF: [184, 122], haF: [206, 144], elB: [189, 120], haB: [212, 144], arrow: { x1: 174, y1: 122, x2: 174, y2: 98 } }
          ]
        },
        pull_lv1: {
          prop: 'door',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezza tirata', '3. Scapole chiuse', '4. Ritorno'],
          frames: [
            { label: 'Partenza: afferra lo stipite, inclinati indietro a braccia tese', faceDir: 1, head: [112, 46], sh: [122, 64], hip: [152, 104], kneeF: [172, 126], footF: [190, 145], kneeB: [176, 126], footB: [195, 145], elF: [162, 66], haF: [200, 68], elB: [162, 62], haB: [200, 64], arrow: { x1: 136, y1: 84, x2: 162, y2: 78 } },
            { label: 'Mezza tirata: porta i gomiti indietro attivando la schiena', faceDir: 1, head: [134, 42], sh: [142, 58], hip: [162, 102], kneeF: [176, 126], footF: [190, 145], kneeB: [180, 126], footB: [195, 145], elF: [148, 78], haF: [200, 68], elB: [150, 74], haB: [200, 64], arrow: { x1: 152, y1: 82, x2: 176, y2: 76 } },
            { label: 'Picco tirata: petto vicino allo stipite, stringi le scapole!', faceDir: 1, head: [164, 38], sh: [168, 56], hip: [176, 100], kneeF: [182, 124], footF: [190, 145], kneeB: [186, 124], footB: [195, 145], elF: [146, 68], haF: [200, 68], elB: [148, 64], haB: [200, 64], arrow: { x1: 166, y1: 88, x2: 140, y2: 94 } }
          ]
        },
        pull_deep: {
          prop: 'door',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezza tirata', '3. Pausa 2s', '4. Ritorno lento'],
          frames: [
            { label: 'Inclinazione maggiore: corpo teso, braccia completamente estese', faceDir: 1, head: [96, 60], sh: [108, 76], hip: [146, 110], kneeF: [172, 128], footF: [192, 145], kneeB: [176, 128], footB: [196, 145], elF: [154, 74], haF: [200, 72], arrow: { x1: 126, y1: 92, x2: 156, y2: 84 } },
            { label: 'Tirata controllata: guida il movimento con i gomiti', faceDir: 1, head: [126, 50], sh: [136, 68], hip: [160, 106], kneeF: [178, 126], footF: [192, 145], kneeB: [182, 126], footB: [196, 145], elF: [144, 86], haF: [200, 72], arrow: { x1: 148, y1: 88, x2: 174, y2: 80 } },
            { label: 'Massima contrazione dorsali: petto vicino allo stipite', faceDir: 1, head: [160, 44], sh: [166, 62], hip: [176, 102], kneeF: [184, 124], footF: [192, 145], kneeB: [188, 124], footB: [196, 145], elF: [140, 76], haF: [200, 72], arrow: { x1: 162, y1: 92, x2: 134, y2: 100 } }
          ]
        },
        shoulders_lv1: {
          prop: 'table',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Posizione a V', '2. Mezza discesa', '3. Fronte al bordo', '4. Spinta'],
          frames: [
            { label: 'Posizione a V morbida: mani sul tavolo, bacino alto, braccia tese', faceDir: 1, head: [174, 60], sh: [158, 56], hip: [114, 52], kneeF: [90, 98], footF: [76, 145], kneeB: [96, 98], footB: [82, 145], elF: [176, 71], haF: [194, 86], arrow: { x1: 166, y1: 74, x2: 180, y2: 84 } },
            { label: 'Mezza discesa: piega i gomiti portando la fronte in avanti', faceDir: 1, head: [184, 70], sh: [166, 64], hip: [118, 56], kneeF: [92, 101], footF: [76, 145], kneeB: [98, 101], footB: [82, 145], elF: [166, 82], haF: [194, 86], arrow: { x1: 174, y1: 80, x2: 186, y2: 88 } },
            { label: 'Punto basso: fronte vicina al bordo, spingi via con le spalle', faceDir: 1, head: [194, 78], sh: [174, 72], hip: [122, 62], kneeF: [94, 104], footF: [76, 145], kneeB: [100, 104], footB: [82, 145], elF: [160, 88], haF: [194, 86], arrow: { x1: 176, y1: 96, x2: 158, y2: 80 } }
          ]
        },
        shoulders_lv2: {
          prop: 'chair_right',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. V alta', '2. Mezza discesa', '3. Spalle cariche', '4. Spinta su'],
          frames: [
            { label: 'Mani sulla sedia, bacino ben alto per caricare le spalle', faceDir: 1, head: [178, 78], sh: [164, 70], hip: [120, 48], kneeF: [94, 96], footF: [80, 145], kneeB: [100, 96], footB: [86, 145], elF: [180, 88], haF: [196, 104], arrow: { x1: 168, y1: 88, x2: 182, y2: 98 } },
            { label: 'Mezza discesa controllata verso la sedia', faceDir: 1, head: [188, 90], sh: [172, 82], hip: [124, 54], kneeF: [96, 100], footF: [80, 145], kneeB: [102, 100], footB: [86, 145], elF: [168, 98], haF: [196, 104], arrow: { x1: 174, y1: 96, x2: 186, y2: 104 } },
            { label: 'Punto basso: gomiti piegati, poi spingi forte in alto', faceDir: 1, head: [196, 98], sh: [178, 92], hip: [128, 62], kneeF: [98, 104], footF: [80, 145], kneeB: [104, 104], footB: [86, 145], elF: [162, 106], haF: [196, 104], arrow: { x1: 176, y1: 114, x2: 160, y2: 96 } }
          ]
        },
        shoulders_floor: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. V a terra', '2. Mezza discesa', '3. Testa giù', '4. Spinta'],
          frames: [
            { label: 'Pike a terra: V rovesciata, braccia tese, sguardo verso i piedi', faceDir: 1, head: [182, 110], sh: [170, 96], hip: [130, 56], kneeF: [98, 102], footF: [76, 144], kneeB: [104, 102], footB: [82, 144], elF: [181, 120], haF: [192, 144], arrow: { x1: 182, y1: 120, x2: 196, y2: 132 } },
            { label: 'Mezza discesa: porta la testa leggermente avanti rispetto alle mani', faceDir: 1, head: [196, 124], sh: [180, 110], hip: [134, 66], kneeF: [100, 106], footF: [76, 144], kneeB: [106, 106], footB: [82, 144], elF: [172, 128], haF: [192, 144], arrow: { x1: 190, y1: 126, x2: 204, y2: 138 } },
            { label: 'Punto basso: testa vicino al tappetino, spingi su con le spalle', faceDir: 1, head: [208, 134], sh: [188, 122], hip: [138, 76], kneeF: [102, 110], footF: [76, 144], kneeB: [108, 110], footB: [82, 144], elF: [168, 132], haF: [192, 144], arrow: { x1: 192, y1: 132, x2: 174, y2: 114 } }
          ]
        },
        chair_dip: {
          prop: 'chair_left',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia tese', '2. Mezza discesa', '3. Gomiti a 90°', '4. Spinta su'],
          frames: [
            { label: 'Partenza: mani sul bordo sedia, braccia tese, schiena vicina', faceDir: 1, head: [122, 60], sh: [116, 78], hip: [120, 112], kneeF: [158, 110], footF: [164, 145], kneeB: [164, 110], footB: [170, 145], elF: [104, 92], haF: [94, 104], arrow: { x1: 134, y1: 94, x2: 134, y2: 114 } },
            { label: 'Mezza discesa: piega i gomiti indietro tenendo il busto vicino', faceDir: 1, head: [124, 72], sh: [118, 90], hip: [122, 122], kneeF: [160, 116], footF: [164, 145], kneeB: [166, 116], footB: [170, 145], elF: [98, 98], haF: [94, 104], arrow: { x1: 134, y1: 102, x2: 134, y2: 122 } },
            { label: 'Punto basso (gomiti a 90°): spingi con i tricipiti per risalire', faceDir: 1, head: [126, 84], sh: [120, 102], hip: [124, 134], kneeF: [162, 122], footF: [164, 145], kneeB: [168, 122], footB: [170, 145], elF: [92, 96], haF: [94, 104], arrow: { x1: 134, y1: 124, x2: 134, y2: 100 } }
          ]
        },
        core_lv1: {
          prop: 'table',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Allineamento', '2. Contrai addome', '3. Respira', '4. Tieni'],
          frames: [
            { label: 'Plank inclinato: mani sul tavolo, corpo in linea retta', faceDir: 1, head: [176, 50], sh: [166, 66], hip: [124, 100], kneeF: [92, 124], footF: [64, 145], kneeB: [98, 124], footB: [72, 145], elF: [180, 76], haF: [194, 86] },
            { label: 'Spingi via il tavolo e contrai addome e glutei (non inarcare!)', faceDir: 1, head: [177, 49], sh: [167, 65], hip: [124, 98], kneeF: [92, 123], footF: [64, 145], kneeB: [98, 123], footB: [72, 145], elF: [180, 75], haF: [194, 86], arrow: { x1: 124, y1: 116, x2: 124, y2: 98 } },
            { label: 'Mantieni la posizione respirando in modo regolare', faceDir: 1, head: [176, 50], sh: [166, 66], hip: [124, 99], kneeF: [92, 124], footF: [64, 145], kneeB: [98, 124], footB: [72, 145], elF: [180, 76], haF: [194, 86] }
          ]
        },
        core_lv2: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Gomiti a terra', '2. Addome stretto', '3. Linea retta', '4. Tieni'],
          frames: [
            { label: 'Plank classico sui gomiti: gomiti sotto le spalle, sguardo a terra', faceDir: 1, head: [214, 108], sh: [194, 114], hip: [138, 122], kneeF: [92, 134], footF: [52, 144], kneeB: [96, 134], footB: [58, 144], elF: [192, 142], haF: [214, 144] },
            { label: 'Stringi addome e glutei: nessuna curva nella bassa schiena', faceDir: 1, head: [214, 106], sh: [194, 112], hip: [138, 120], kneeF: [92, 133], footF: [52, 144], kneeB: [96, 133], footB: [58, 144], elF: [192, 142], haF: [214, 144], arrow: { x1: 138, y1: 138, x2: 138, y2: 122 } },
            { label: 'Respira calmo tenendo la linea retta fino alla fine del timer', faceDir: 1, head: [214, 108], sh: [194, 114], hip: [138, 122], kneeF: [92, 134], footF: [52, 144], kneeB: [96, 134], footB: [58, 144], elF: [192, 142], haF: [214, 144] }
          ]
        },
        shoulder_taps: {
          prop: 'mat',
          sequence: [0, 1, 2, 3],
          stepLabels: ['1. Plank mani', '2. Tocco dx', '3. Centro', '4. Tocco sx'],
          frames: [
            { label: 'Partenza in plank sulle mani: bacino fermo e stabile', faceDir: 1, head: [216, 84], sh: [198, 96], hip: [140, 114], kneeF: [94, 129], footF: [52, 144], kneeB: [98, 129], footB: [58, 144], elF: [200, 120], haF: [202, 144], elB: [192, 120], haB: [194, 144] },
            { label: 'Solleva la mano destra e tocca la spalla sinistra senza oscillare', faceDir: 1, head: [216, 84], sh: [198, 96], hip: [140, 114], kneeF: [94, 129], footF: [52, 144], kneeB: [98, 129], footB: [58, 144], elF: [184, 114], haF: [196, 98], elB: [196, 120], haB: [198, 144], arrow: { x1: 206, y1: 132, x2: 196, y2: 108 } },
            { label: 'Riappoggia la mano con controllo e stabilizza il core', faceDir: 1, head: [216, 84], sh: [198, 96], hip: [140, 114], kneeF: [94, 129], footF: [52, 144], kneeB: [98, 129], footB: [58, 144], elF: [200, 120], haF: [202, 144], elB: [192, 120], haB: [194, 144] },
            { label: 'Ora tocca la spalla destra con la mano sinistra, fianchi immobili', faceDir: 1, head: [216, 84], sh: [198, 96], hip: [140, 114], kneeF: [94, 129], footF: [52, 144], kneeB: [98, 129], footB: [58, 144], elF: [200, 120], haF: [202, 144], elB: [180, 112], haB: [194, 98], arrow: { x1: 186, y1: 132, x2: 192, y2: 108 } }
          ]
        },
        core_lv4: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Sui gomiti', '2. Passaggio', '3. Sulle mani', '4. Discesa'],
          frames: [
            { label: 'Partenza in plank sui gomiti, core ben attivo', faceDir: 1, head: [214, 108], sh: [194, 114], hip: [138, 122], kneeF: [92, 134], footF: [52, 144], kneeB: [96, 134], footB: [58, 144], elF: [192, 142], haF: [214, 144] },
            { label: 'Appoggia una mano alla volta e spingi verso l\'alto', faceDir: 1, head: [216, 94], sh: [196, 104], hip: [139, 118], kneeF: [93, 131], footF: [52, 144], kneeB: [97, 131], footB: [58, 144], elF: [190, 124], haF: [204, 144], elB: [192, 142], haB: [214, 144], arrow: { x1: 194, y1: 102, x2: 194, y2: 84 } },
            { label: 'Plank alto sulle mani, poi riscendi sui gomiti con controllo', faceDir: 1, head: [218, 84], sh: [200, 96], hip: [142, 114], kneeF: [96, 129], footF: [52, 144], kneeB: [100, 129], footB: [58, 144], elF: [202, 120], haF: [204, 144] }
          ]
        },
        squat: {
          prop: 'chair_left',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. In piedi', '2. Mezza discesa', '3. Sfiora sedia', '4. Risalita'],
          frames: [
            { label: 'In piedi davanti alla sedia, petto aperto, piedi larghezza spalle', faceDir: 1, head: [142, 34], sh: [140, 52], hip: [138, 94], kneeF: [142, 122], footF: [140, 145], kneeB: [148, 122], footB: [146, 145], elF: [152, 74], haF: [164, 86], arrow: { x1: 124, y1: 86, x2: 108, y2: 102 } },
            { label: 'Mezza discesa: porta il bacino indietro, braccia avanti per equilibrio', faceDir: 1, head: [134, 48], sh: [128, 66], hip: [110, 102], kneeF: [148, 118], footF: [140, 145], kneeB: [154, 118], footB: [146, 145], elF: [158, 70], haF: [182, 70], arrow: { x1: 112, y1: 96, x2: 96, y2: 108 } },
            { label: 'Squat basso: sfiora la sedia con i glutei e spingi sui talloni per risalire', faceDir: 1, head: [128, 62], sh: [120, 78], hip: [94, 108], kneeF: [152, 114], footF: [140, 145], kneeB: [158, 114], footB: [146, 145], elF: [154, 78], haF: [184, 76], arrow: { x1: 116, y1: 96, x2: 126, y2: 72 } }
          ]
        },
        squat_press: {
          prop: 'floor',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Squat basso', '2. Risalita', '3. Spinta in alto', '4. Ritorno'],
          frames: [
            { label: 'Squat basso: bacino indietro, mani raccolte davanti alle spalle', faceDir: 1, head: [142, 62], sh: [134, 78], hip: [108, 108], kneeF: [160, 112], footF: [146, 145], kneeB: [166, 112], footB: [152, 145], elF: [144, 96], haF: [156, 82], arrow: { x1: 146, y1: 58, x2: 146, y2: 34 } },
            { label: 'Risali con energia estendendo gambe e iniziando la spinta braccia', faceDir: 1, head: [142, 46], sh: [138, 62], hip: [128, 98], kneeF: [150, 122], footF: [146, 145], kneeB: [155, 122], footB: [152, 145], elF: [148, 64], haF: [156, 44], arrow: { x1: 162, y1: 42, x2: 162, y2: 20 } },
            { label: 'In piedi completamente disteso con braccia in alto!', faceDir: 1, head: [142, 36], sh: [140, 52], hip: [140, 94], kneeF: [144, 122], footF: [144, 145], kneeB: [150, 122], footB: [150, 145], elF: [142, 34], haF: [144, 16], elB: [148, 34], haB: [150, 16], arrow: { x1: 122, y1: 44, x2: 122, y2: 68 } }
          ]
        },
        lunge: {
          prop: 'floor',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. In piedi', '2. Passo indietro', '3. Affondo basso', '4. Risalita'],
          frames: [
            { label: 'Partenza in piedi, busto eretto e addome attivo', faceDir: 1, head: [144, 34], sh: [142, 52], hip: [140, 94], kneeF: [142, 122], footF: [142, 145], kneeB: [136, 122], footB: [134, 145], elF: [140, 74], haF: [144, 92] },
            { label: 'Fai un passo indietro controllato mantenendo il busto dritto', faceDir: 1, head: [144, 42], sh: [142, 60], hip: [138, 100], kneeF: [164, 120], footF: [168, 145], kneeB: [112, 124], footB: [96, 145], elF: [144, 80], haF: [154, 92], arrow: { x1: 138, y1: 98, x2: 138, y2: 118 } },
            { label: 'Affondo basso: ginocchia a ~90°, spingi dal piede davanti per tornare su', faceDir: 1, head: [144, 56], sh: [142, 74], hip: [138, 114], kneeF: [172, 116], footF: [172, 145], kneeB: [110, 138], footB: [88, 145], elF: [144, 92], haF: [154, 104], arrow: { x1: 162, y1: 108, x2: 162, y2: 84 } }
          ]
        },
        mountain_climber: {
          prop: 'table',
          sequence: [0, 1, 2, 3],
          stepLabels: ['1. Plank', '2. Ginocchio dx', '3. Plank', '4. Ginocchio sx'],
          frames: [
            { label: 'Mani salde sul tavolo, corpo in linea dritta (plank)', faceDir: 1, head: [176, 44], sh: [164, 58], hip: [122, 96], kneeF: [92, 122], footF: [64, 145], kneeB: [98, 122], footB: [72, 145], elF: [180, 72], haF: [196, 86] },
            { label: 'Porta il ginocchio destro verso il petto senza alzare il bacino', faceDir: 1, head: [176, 44], sh: [164, 58], hip: [122, 96], kneeF: [158, 96], footF: [138, 118], kneeB: [94, 122], footB: [66, 145], elF: [180, 72], haF: [196, 86], arrow: { x1: 122, y1: 118, x2: 152, y2: 106 } },
            { label: 'Riporta indietro la gamba con controllo', faceDir: 1, head: [176, 44], sh: [164, 58], hip: [122, 96], kneeF: [92, 122], footF: [64, 145], kneeB: [98, 122], footB: [72, 145], elF: [180, 72], haF: [196, 86] },
            { label: 'Ora porta il ginocchio sinistro avanti a ritmo costante', faceDir: 1, head: [176, 44], sh: [164, 58], hip: [122, 96], kneeF: [92, 122], footF: [64, 145], kneeB: [158, 96], footB: [138, 118], elF: [180, 72], haF: [196, 86], arrow: { x1: 122, y1: 118, x2: 152, y2: 106 } }
          ]
        },
        jumping_jack: {
          prop: 'floor',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Chiuso', '2. Apertura', '3. Braccia in alto', '4. Ritorno'],
          frames: [
            { frontView: true, label: 'Partenza: piedi vicini, braccia lungo i fianchi', head: [140, 34], shL: [126, 52], shR: [154, 52], hipL: [131, 94], hipR: [149, 94], elL: [122, 74], haL: [120, 96], elR: [158, 74], haR: [160, 96], kneeL: [132, 120], footL: [132, 145], kneeR: [148, 120], footR: [148, 145] },
            { frontView: true, label: 'Apri un passo (o saltello leggero) sollevando le braccia lateralmente', head: [140, 34], shL: [126, 52], shR: [154, 52], hipL: [131, 94], hipR: [149, 94], elL: [104, 54], haL: [84, 50], elR: [176, 54], haR: [196, 50], kneeL: [122, 120], footL: [116, 145], kneeR: [158, 120], footR: [164, 145] },
            { frontView: true, label: 'Massima apertura: braccia sopra la testa e gambe aperte', head: [140, 34], shL: [126, 52], shR: [154, 52], hipL: [131, 94], hipR: [149, 94], elL: [112, 30], haL: [126, 14], elR: [168, 30], haR: [154, 14], kneeL: [114, 120], footL: [104, 145], kneeR: [166, 120], footR: [176, 145] }
          ]
        },
        glute_bridge: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. A terra', '2. Salita bacino', '3. Ponte alto', '4. Discesa'],
          frames: [
            { label: 'Supino a terra, ginocchia piegate, piedi vicini ai glutei', faceDir: 1, head: [66, 134], sh: [84, 140], hip: [138, 140], kneeF: [168, 108], footF: [194, 144], kneeB: [174, 108], footB: [199, 144], elF: [112, 142], haF: [142, 144], arrow: { x1: 138, y1: 124, x2: 138, y2: 104 } },
            { label: 'Spingi sui talloni sollevando gradualmente il bacino', faceDir: 1, head: [66, 134], sh: [84, 140], hip: [138, 124], kneeF: [170, 104], footF: [194, 144], kneeB: [176, 104], footB: [199, 144], elF: [112, 142], haF: [142, 144], arrow: { x1: 138, y1: 110, x2: 138, y2: 92 } },
            { label: 'Ponte completo: linea dritta spalle-bacino-ginocchia, stringi 2s', faceDir: 1, head: [66, 134], sh: [84, 140], hip: [138, 108], kneeF: [174, 98], footF: [194, 144], kneeB: [180, 98], footB: [199, 144], elF: [112, 142], haF: [142, 144] }
          ]
        },
        superman_pull: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia avanti', '2. Solleva e tira', '3. Gomiti a W', '4. Distendi'],
          frames: [
            { label: 'Prono a pancia in giù, braccia distese davanti, sguardo a terra', faceDir: 1, head: [194, 134], sh: [176, 138], hip: [118, 140], kneeF: [78, 142], footF: [46, 142], elF: [208, 140], haF: [236, 140], arrow: { x1: 222, y1: 122, x2: 186, y2: 118 } },
            { label: 'Solleva leggermente il petto e inizia a tirare i gomiti indietro', faceDir: 1, head: [196, 124], sh: [176, 130], hip: [118, 140], kneeF: [78, 142], footF: [46, 142], elF: [188, 128], haF: [214, 128], arrow: { x1: 196, y1: 112, x2: 164, y2: 114 } },
            { label: 'Gomiti tirati ai fianchi (forma a W): stringi forte le scapole!', faceDir: 1, head: [198, 120], sh: [176, 126], hip: [118, 140], kneeF: [78, 142], footF: [46, 142], elF: [152, 130], haF: [176, 126] }
          ]
        },
        wall_angels: {
          prop: 'wall_back',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia a W', '2. Scivola su', '3. Braccia a Y', '4. Scivola giù'],
          frames: [
            { frontView: true, label: 'Schiena, nuca e braccia appoggiate al muro dietro di te (a W)', head: [140, 42], shL: [125, 60], shR: [155, 60], hipL: [131, 100], hipR: [149, 100], elL: [100, 74], haL: [96, 48], elR: [180, 74], haR: [184, 48], kneeL: [131, 124], footL: [128, 146], kneeR: [149, 124], footR: [152, 146], arrow: [{ x1: 82, y1: 62, x2: 82, y2: 36 }, { x1: 198, y1: 62, x2: 198, y2: 36 }] },
            { frontView: true, label: 'Fai scivolare avambracci e dorso delle mani verso l\'alto sul muro', head: [140, 42], shL: [125, 60], shR: [155, 60], hipL: [131, 100], hipR: [149, 100], elL: [96, 56], haL: [94, 30], elR: [184, 56], haR: [186, 30], kneeL: [131, 124], footL: [128, 146], kneeR: [149, 124], footR: [152, 146], arrow: [{ x1: 80, y1: 48, x2: 80, y2: 24 }, { x1: 200, y1: 48, x2: 200, y2: 24 }] },
            { frontView: true, label: 'Distendi le braccia in alto a Y mantenendo la schiena aderente al muro', head: [140, 42], shL: [125, 60], shR: [155, 60], hipL: [131, 100], hipR: [149, 100], elL: [108, 38], haL: [96, 18], elR: [172, 38], haR: [184, 18], kneeL: [131, 124], footL: [128, 146], kneeR: [149, 124], footR: [152, 146], arrow: [{ x1: 82, y1: 24, x2: 82, y2: 50 }, { x1: 198, y1: 24, x2: 198, y2: 50 }] }
          ]
        },
        towel_curl: {
          prop: 'floor',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Prepara presa', '2. Tira in alto', '3. Tensione max', '4. Rilascia'],
          frames: [
            { label: 'Passa l\'asciugamano sotto la coscia sollevata, gomiti vicini al busto', faceDir: 1, head: [130, 36], sh: [128, 54], hip: [126, 94], kneeF: [164, 98], footF: [168, 132], kneeB: [126, 122], footB: [126, 145], elF: [130, 80], haF: [156, 88], towel: [[154, 88], [150, 99]], arrow: { x1: 174, y1: 88, x2: 174, y2: 66 } },
            { label: 'Tira con forza verso l\'alto usando i bicipiti: la coscia fa resistenza', faceDir: 1, head: [130, 36], sh: [128, 54], hip: [126, 94], kneeF: [164, 94], footF: [168, 128], kneeB: [126, 122], footB: [126, 145], elF: [128, 78], haF: [152, 76], towel: [[150, 76], [150, 95]], arrow: { x1: 174, y1: 80, x2: 174, y2: 56 } },
            { label: 'Contrazione isometrica intensa sui bicipiti (tieni la schiena ferma!)', faceDir: 1, head: [130, 36], sh: [128, 54], hip: [126, 94], kneeF: [164, 90], footF: [168, 124], kneeB: [126, 122], footB: [126, 145], elF: [128, 76], haF: [146, 66], towel: [[146, 66], [150, 91]] }
          ]
        },
        inchworm: {
          prop: 'mat',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Mani a terra', '2. Cammina avanti', '3. Plank pieno', '4. Torna su'],
          frames: [
            { label: 'Piega leggermente le ginocchia e appoggia le mani davanti ai piedi', faceDir: 1, head: [104, 104], sh: [98, 92], hip: [72, 78], kneeF: [68, 114], footF: [64, 144], kneeB: [74, 114], footB: [70, 144], elF: [98, 118], haF: [102, 144], arrow: { x1: 112, y1: 136, x2: 148, y2: 136 } },
            { label: 'Cammina in avanti con le mani mantenendo il core attivo', faceDir: 1, head: [168, 90], sh: [156, 96], hip: [112, 92], kneeF: [84, 118], footF: [64, 144], kneeB: [90, 118], footB: [70, 144], elF: [162, 120], haF: [168, 144], arrow: { x1: 174, y1: 136, x2: 204, y2: 136 } },
            { label: 'Arriva in plank completo (tieni 2–5s), poi cammina indietro', faceDir: 1, head: [222, 86], sh: [204, 96], hip: [146, 114], kneeF: [100, 130], footF: [64, 144], kneeB: [104, 130], footB: [70, 144], elF: [204, 120], haF: [206, 144], arrow: { x1: 186, y1: 134, x2: 152, y2: 134 } }
          ]
        },
        dead_bug: {
          prop: 'mat',
          sequence: [0, 1, 2, 3],
          stepLabels: ['1. Centro 90°', '2. Lato dx/sx', '3. Centro', '4. Lato opposto'],
          frames: [
            { label: 'Supino, schiena incollata a terra: braccia in alto e ginocchia a 90°', faceDir: 1, head: [76, 134], sh: [94, 140], hip: [146, 140], kneeF: [148, 106], footF: [180, 106], kneeB: [154, 106], footB: [186, 106], elF: [94, 114], haF: [94, 90], elB: [100, 114], haB: [100, 90] },
            { label: 'Distendi lentamente braccio e gamba opposti senza staccare la schiena', faceDir: 1, head: [76, 134], sh: [94, 140], hip: [146, 140], kneeF: [188, 130], footF: [224, 132], kneeB: [150, 106], footB: [182, 106], elF: [72, 126], haF: [48, 124], elB: [98, 114], haB: [98, 90] },
            { label: 'Torna al centro controllando bene l\'addome', faceDir: 1, head: [76, 134], sh: [94, 140], hip: [146, 140], kneeF: [148, 106], footF: [180, 106], kneeB: [154, 106], footB: [186, 106], elF: [94, 114], haF: [94, 90], elB: [100, 114], haB: [100, 90] },
            { label: 'Cambia lato: distendi l\'altro braccio e l\'altra gamba con calma', faceDir: 1, head: [76, 134], sh: [94, 140], hip: [146, 140], kneeF: [148, 106], footF: [180, 106], kneeB: [188, 130], footB: [224, 132], elF: [94, 114], haF: [94, 90], elB: [72, 126], haB: [48, 124] }
          ]
        },
        shadow_boxing: {
          prop: 'floor',
          sequence: [0, 1, 2, 3],
          stepLabels: ['1. Guardia', '2. Jab', '3. Guardia', '4. Cross'],
          frames: [
            { label: 'Guardia alta: pugni vicini al mento, ginocchia morbide', faceDir: 1, head: [132, 38], sh: [128, 56], hip: [126, 96], kneeF: [146, 120], footF: [150, 145], kneeB: [110, 122], footB: [102, 145], elF: [136, 76], haF: [152, 54], elB: [142, 74], haB: [160, 52] },
            { label: 'Colpo diretto destro fluido (non bloccare il gomito!)', faceDir: 1, head: [136, 38], sh: [134, 56], hip: [128, 96], kneeF: [148, 120], footF: [152, 145], kneeB: [110, 122], footB: [102, 145], elF: [164, 56], haF: [194, 54], elB: [132, 74], haB: [146, 52], arrow: { x1: 162, y1: 42, x2: 196, y2: 42 } },
            { label: 'Rientra subito in guardia alta, ritmo vivace', faceDir: 1, head: [132, 38], sh: [128, 56], hip: [126, 96], kneeF: [146, 120], footF: [150, 145], kneeB: [110, 122], footB: [102, 145], elF: [136, 76], haF: [152, 54], elB: [142, 74], haB: [160, 52] },
            { label: 'Colpo incrociato sinistro ruotando leggermente busto e spalle', faceDir: 1, head: [138, 38], sh: [138, 56], hip: [130, 96], kneeF: [148, 120], footF: [152, 145], kneeB: [112, 122], footB: [104, 145], elF: [130, 74], haF: [148, 54], elB: [170, 58], haB: [200, 56], arrow: { x1: 168, y1: 44, x2: 202, y2: 44 } }
          ]
        },
        high_knees: {
          prop: 'floor',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Ginocchio dx', '2. Cambio', '3. Ginocchio sx', '4. Ritmo'],
          frames: [
            { label: 'Solleva il ginocchio destro all\'altezza del bacino, braccia attive', faceDir: 1, head: [142, 34], sh: [138, 52], hip: [136, 94], kneeF: [166, 92], footF: [162, 124], kneeB: [136, 122], footB: [134, 145], elF: [124, 74], haF: [140, 82], elB: [150, 72], haB: [166, 58] },
            { label: 'Appoggio morbido sull\'avampiede, busto dritto', faceDir: 1, head: [142, 36], sh: [138, 54], hip: [136, 96], kneeF: [144, 122], footF: [142, 145], kneeB: [132, 122], footB: [130, 145], elF: [136, 74], haF: [152, 76], elB: [136, 74], haB: [152, 76] },
            { label: 'Alterna con il ginocchio sinistro a ritmo sostenuto', faceDir: 1, head: [142, 34], sh: [138, 52], hip: [136, 94], kneeF: [136, 122], footF: [134, 145], kneeB: [166, 92], footB: [162, 124], elF: [150, 72], haF: [166, 58], elB: [124, 74], haB: [140, 82] }
          ]
        },
        warmup_shoulders: {
          prop: 'floor',
          sequence: [0, 1, 2, 1],
          stepLabels: ['1. Braccia basse', '2. Apertura a T', '3. Cerchio alto', '4. Ritorno'],
          frames: [
            { frontView: true, label: 'Rilassa le spalle lontano dalle orecchie, schiena dritta', head: [140, 36], shL: [124, 54], shR: [156, 54], hipL: [130, 96], hipR: [150, 96], elL: [118, 76], haL: [114, 98], elR: [162, 76], haR: [166, 98], kneeL: [132, 122], footL: [130, 145], kneeR: [148, 122], footR: [150, 145] },
            { frontView: true, label: 'Apri bene le braccia a T aprendo il torace', head: [140, 36], shL: [124, 54], shR: [156, 54], hipL: [130, 96], hipR: [150, 96], elL: [100, 54], haL: [78, 54], elR: [180, 54], haR: [202, 54], kneeL: [132, 122], footL: [130, 145], kneeR: [148, 122], footR: [150, 145] },
            { frontView: true, label: 'Porta le braccia in alto ruotando dolcemente polsi e spalle', head: [140, 36], shL: [124, 54], shR: [156, 54], hipL: [130, 96], hipR: [150, 96], elL: [110, 32], haL: [118, 14], elR: [170, 32], haR: [162, 14], kneeL: [132, 122], footL: [130, 145], kneeR: [148, 122], footR: [150, 145] }
          ]
        }
      };

      const animViewers = {};

      function buildAnimSvgInner(viewerId, anim, frame) {
        const pfx = viewerId.replace(/[^a-zA-Z0-9_-]/g, '');
        return `${renderSvgDefs(pfx)}${renderPropSvg(anim.prop, pfx)}${renderFigureSvg(frame, pfx)}${renderArrowSvg(frame.arrow)}`;
      }


      const PROGRESSIONS = {
        push: [
          { lv: 1, name: 'Piegamenti al muro', animKey: 'push_lv1', target: '3 × 10–12 rip', reps: 10, prop: 'Muro libero', cue: 'Mani all\'altezza del petto, corpo dritto come una tavola, gomiti a 45° (non larghi a T). Scendi lento in 2 secondi.' },
          { lv: 2, name: 'Piegamenti su tavolo o piano cucina', animKey: 'push_lv2', target: '3 × 8–10 rip', reps: 9, prop: 'Tavolo stabile / cucina', cue: 'Appoggia bene i palmi sul bordo sicuro, addome contratto, porta lo sterno vicino al bordo e spingi via.' },
          { lv: 3, name: 'Piegamenti sulle ginocchia', animKey: 'push_lv3', target: '3 × 8–10 rip', reps: 9, prop: 'Asciugamano sotto ginocchia', cue: 'Linea dritta dalle ginocchia alle spalle (non lasciare i glutei indietro). Controlla la discesa.' },
          { lv: 4, name: 'Piegamenti classici a terra', animKey: 'push_lv4', target: '3 × 8–12 rip', reps: 10, prop: 'Pavimento', cue: 'Corpo teso dai talloni alla testa, petto vicino al pavimento, spinta esplosiva ma controllata.' }
        ],
        pull: [
          { lv: 1, name: 'Rematore allo stipite (inclinazione leggera)', animKey: 'pull_lv1', target: '3 × 10 rip', reps: 10, prop: 'Stipite porta robusto', cue: 'Afferra lo stipite con entrambe le mani, piedi vicini alla porta, inclinati leggermente indietro e tira il petto in avanti stringendo le scapole.' },
          { lv: 2, name: 'Rematore allo stipite (inclinazione media)', animKey: 'pull_deep', target: '3 × 12 rip', reps: 12, prop: 'Stipite porta robusto', cue: 'Sposta i piedi un passo più avanti per aumentare il carico. Tira guidando con i gomiti e pausa 1 secondo in cima.' },
          { lv: 3, name: 'Rematore allo stipite con pausa isometrica', animKey: 'pull_deep', target: '3 × 12 rip (2s stop)', reps: 12, prop: 'Stipite porta robusto', cue: 'Mantieni 2 secondi di contrazione massima con scapole unite ad ogni ripetizione.' },
          { lv: 4, name: 'Rematore allo stipite a un braccio', animKey: 'pull_deep', target: '3 × 8 rip per lato', reps: 8, prop: 'Stipite porta robusto', cue: 'Tieni il busto fermo senza ruotare le spalle. Eccellente per forza dorsale e braccia.' }
        ],
        shoulders: [
          { lv: 1, name: 'Spinta spalle inclinata al tavolo (Pike facile)', animKey: 'shoulders_lv1', target: '3 × 8 rip', reps: 8, prop: 'Tavolo o sedia stabile', cue: 'Mani sul tavolo, piedi indietro, forma una V morbida con il bacino. Piega i gomiti portando la fronte verso il bordo e spingi su.' },
          { lv: 2, name: 'Pike Push-Up con mani su sedia', animKey: 'shoulders_lv2', target: '3 × 8–10 rip', reps: 9, prop: 'Sedia contro il muro', cue: 'Bacino più alto rispetto alle spalle per caricare i deltoidi. Scendi in diagonale avanti rispetto alle mani.' },
          { lv: 3, name: 'Pike Push-Up a terra (ginocchia morbide)', animKey: 'shoulders_floor', target: '3 × 8–10 rip', reps: 9, prop: 'Pavimento', cue: 'Posizione a V rovesciata a terra, testa verso un punto davanti alle mani formando un triangolo.' },
          { lv: 4, name: 'Pike Push-Up completo', animKey: 'shoulders_floor', target: '3 × 10–12 rip', reps: 10, prop: 'Pavimento', cue: 'Gambe più tese, movimento lento e controllato per spalle forti e definite.' }
        ],
        core: [
          { lv: 1, name: 'Plank inclinato su tavolo o sulle ginocchia', animKey: 'core_lv1', target: '3 × 20 sec', sec: 20, prop: 'Tavolo o asciugamano', cue: 'Spingi via con le mani, stringi glutei e addome come se dovessi ricevere un colpetto. Non inarcare la zona lombare.' },
          { lv: 2, name: 'Plank sui gomiti classico', animKey: 'core_lv2', target: '3 × 25–30 sec', sec: 25, prop: 'Pavimento', cue: 'Gomiti sotto le spalle, sguardo tra le mani, respirazione regolare senza andare in apnea.' },
          { lv: 3, name: 'Plank con Shoulder Taps', animKey: 'shoulder_taps', target: '3 × 35 sec', sec: 35, prop: 'Pavimento', cue: 'In plank sulle mani, tocca lentamente la spalla opposta mantenendo i fianchi fermissimi.' },
          { lv: 4, name: 'Plank dinamico (su/giù sui gomiti)', animKey: 'core_lv4', target: '3 × 40 sec', sec: 40, prop: 'Pavimento', cue: 'Alterna appoggio gomiti e mani con controllo: allena core, tricipiti e spalle insieme.' }
        ]
      };

      function buildExercise(ex) {
        if (ex.track) {
          const lv = Math.min(4, Math.max(1, state.training.levels[ex.track] || 1));
          const p = PROGRESSIONS[ex.track][lv - 1];
          return Object.assign({}, ex, {
            name: p.name, animKey: p.animKey, level: lv, prop: p.prop, cue: p.cue,
            type: p.sec ? 'time' : 'reps', value: p.sec ? p.sec : p.reps, targetLabel: p.target
          });
        }
        return ex;
      }

      // ──────────────────────────────────────────────────────────────
      // WORKOUT PROGRAMS (Default ~60 min in 5 blocks, scalable to 30m / 15m)
      // ──────────────────────────────────────────────────────────────
      function calcWorkoutMinutes(exercises) {
        let totalSec = 0;
        exercises.forEach(raw => {
          const ex = buildExercise(raw);
          const workPerSet = ex.type === 'time' ? ex.value : Math.max(32, ex.value * 3.5);
          totalSec += (ex.sets * workPerSet) + (Math.max(0, ex.sets - 1) * (ex.rest || 45)) + 60;
        });
        return Math.max(10, Math.round(totalSec / 60));
      }

      function adaptWorkoutForMode(w, mode) {
        // mode: 'full60' (~60m) | 'med30' (~30m) | 'quick15' (~15m)
        const filtered = w.exercises.filter(ex => {
          if (mode === 'full60') return true;
          if (mode === 'med30') return ex.tier !== 'full';
          return ex.tier === 'core';
        }).map((ex, idx) => {
          if (mode === 'full60') {
            return Object.assign({}, ex, { sets: ex.sets60, rest: ex.rest60 });
          }
          if (mode === 'med30') {
            const boostSet = (ex.block === 'Forza Upper' || ex.block === 'Forza Gambe' || ex.block === 'Brucia-Grassi') && idx <= 4 ? 1 : 0;
            const sets = Math.min(4, ex.sets30 + boostSet);
            const rest = Math.max(25, Math.round(ex.rest60 * 0.85));
            return Object.assign({}, ex, { sets, rest });
          }
          // quick15
          const sets = (ex.block === 'Riscaldamento' || ex.block === 'Defaticamento') ? 1 : Math.max(2, ex.sets15 + (idx === 1 ? 1 : 0));
          const rest = Math.max(20, Math.round(ex.rest60 * 0.65));
          return Object.assign({}, ex, { sets, rest });
        });
        return Object.assign({}, w, {
          exercises: filtered,
          estMin: calcWorkoutMinutes(filtered)
        });
      }

      function getPhaseWorkouts(phase) {
        const mode = state.training.durationMode || 'full60';

        const phase1Raw = [
          {
            key: 'p1-lun', dayShort: 'Lun', dayFull: 'Lunedì', jsDay: 1,
            focus: 'Upper Spinta, Core & Brucia-Grassi', tag: 'Forza Upper', kcalFactor: 5.8,
            summary: 'Sessione completa da 1 ora focalizzata su petto, spalle, tricipiti e addome, chiusa da un blocco brucia-calorie e stretching posturale.',
            exercises: [
              { id: 'wu-1a', block: 'Riscaldamento', tier: 'core', animKey: 'warmup_shoulders', name: 'Mobilità spalle, polsi e rotazioni braccia', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Articolazioni Upper', prop: 'Nessuno', cue: 'Cerchi ampi e lenti con le braccia avanti e indietro, rotazioni polsi e apertura petto.', mistake: 'Saltare il riscaldamento a freddo: protegge subito spalle e polsi.' },
              { id: 'wu-1b', block: 'Riscaldamento', tier: 'full', animKey: 'high_knees', name: 'Marcia di attivazione progressiva', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Attivazione Cardio', prop: 'Nessuno', cue: 'Alza gradualmente battito e temperatura corporea prima di spingere.', mistake: 'Partire subito in affanno.' },
              { id: 'p1-l-1', block: 'Forza Upper', tier: 'core', track: 'push', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Petto & Tricipiti', mistake: 'Allargare i gomiti a 90° o lasciare cadere il bacino verso il basso.' },
              { id: 'p1-l-2', block: 'Forza Upper', tier: 'core', track: 'shoulders', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Spalle (Deltoidi)', mistake: 'Guardare dritto in avanti irrigidendo il collo invece di guardare verso i piedi.' },
              { id: 'p1-l-3', block: 'Forza Upper', tier: 'med', animKey: 'chair_dip', name: 'Dip su sedia (gambe piegate)', type: 'reps', value: 10, sets60: 4, sets30: 3, sets15: 2, rest60: 75, muscle: 'Tricipiti', prop: 'Sedia stabile contro il muro', cue: 'Mani sul bordo della sedia, piedi vicini con ginocchia piegate. Scendi tenendo la schiena vicina alla sedia e risali.', mistake: 'Scendere troppo se senti tensione anteriore alla spalla: fermati con gomiti a 90°.' },
              { id: 'p1-l-4', block: 'Forza Upper', tier: 'full', animKey: 'shoulder_taps', name: 'Plank Shoulder Taps (stabilità spalle)', type: 'time', value: 35, sets60: 3, sets30: 2, sets15: 2, rest60: 60, muscle: 'Spalle & Core', prop: 'Tavolo o pavimento', cue: 'Tocca lentamente la spalla opposta mantenendo fianchi e busto fermissimi.', mistake: 'Oscillare da destra a sinistra.' },
              { id: 'p1-l-5', block: 'Supporto & Core', tier: 'core', track: 'core', sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Core & Postura', mistake: 'Trattenere il respiro o inarcare la bassa schiena.' },
              { id: 'p1-l-6', block: 'Supporto & Core', tier: 'full', animKey: 'squat', name: 'Squat controllati (richiamo metabolico gambe)', type: 'reps', value: 14, sets60: 4, sets30: 2, sets15: 2, rest60: 60, muscle: 'Gambe & Consumo kcal', prop: 'Sedia opzionale dietro', cue: 'Usare i grandi muscoli delle gambe moltiplica il dispendio calorico della sessione.', mistake: 'Sollevare i talloni da terra.' },
              { id: 'p1-l-7', block: 'Brucia-Grassi', tier: 'core', animKey: 'shadow_boxing', name: 'Shadow Boxing + Marcia veloce', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Cardio & Spalle', prop: 'Nessuno', cue: 'Alterna pugni rapidi in aria (guardia alta) mentre marci sul posto a passo sostenuto.', mistake: 'Bloccare i gomiti nei pugni: mantieni il colpo fluido.' },
              { id: 'p1-l-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'jumping_jack', name: 'Jumping Jack soft (senza impatto se preferisci)', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Dimagrimento', prop: 'Nessuno', cue: 'Ritmo regolare e respirazione fluida per chiudere la fase aerobica.', mistake: 'Atterrare rigido sui talloni.' },
              { id: 'p1-l-9', block: 'Defaticamento', tier: 'full', animKey: 'wall_angels', name: 'Defaticamento: Wall Angels lenti & respirazione', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Postura & Recupero', prop: 'Muro', cue: 'Scivola dolcemente con le braccia al muro aprendo il petto e abbassando il battito.', mistake: 'Fretta: goditi il recupero finale.' }
            ]
          },
          {
            key: 'p1-mar', dayShort: 'Mar', dayFull: 'Martedì', jsDay: 2,
            focus: 'Brucia-Grassi Low-Impact, Gambe & Postura', tag: 'Dimagrimento', kcalFactor: 6.5,
            summary: 'Mentre petto e braccia recuperano, 1 ora dedicata a dimagrimento, gambe, addome e mobilità anti-scrivania.',
            exercises: [
              { id: 'wu-2a', block: 'Riscaldamento', tier: 'core', animKey: 'high_knees', name: 'Marcia sul posto + slanci braccia', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Alza gradualmente il battito muovendo bene braccia e ginocchia.', mistake: 'Partire subito troppo forte.' },
              { id: 'wu-2b', block: 'Riscaldamento', tier: 'full', animKey: 'warmup_shoulders', name: 'Aperture toraciche & mobilità spalle', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Mobilità', prop: 'Nessuno', cue: 'Sciogli le tensioni di collo e spalle accumulate seduto.', mistake: 'Alzare le spalle alle orecchie.' },
              { id: 'p1-m-1', block: 'Forza Gambe', tier: 'core', animKey: 'squat', name: 'Squat controllati (guida sedia)', type: 'reps', value: 14, sets60: 4, sets30: 3, sets15: 2, rest60: 70, muscle: 'Gambe & Glutei', prop: 'Sedia opzionale dietro', cue: 'Piedi larghezza spalle, bacino indietro fino a sfiorare la sedia e spinta sui talloni.', mistake: 'Ginocchia che chiudono verso l\'interno.' },
              { id: 'p1-m-2', block: 'Forza Gambe', tier: 'core', animKey: 'lunge', name: 'Affondi indietro alternati (Step-Back)', type: 'reps', value: 12, sets60: 4, sets30: 3, sets15: 2, rest60: 75, muscle: 'Gambe & Stabilità', prop: 'Nessuno (muro vicino se serve)', cue: 'Passo indietro controllato (6 per gamba), busto eretto, spingi dalla gamba anteriore.', mistake: 'Passo troppo stretto.' },
              { id: 'p1-m-3', block: 'Supporto & Core', tier: 'med', animKey: 'glute_bridge', name: 'Ponte Glutei con pausa 2s in alto', type: 'reps', value: 14, sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Glutei & Bassa Schiena', prop: 'Asciugamano a terra', cue: 'Spingi il bacino in alto stringendo i glutei per 2 secondi. Ottimo dopo ore seduto.', mistake: 'Spingere con la schiena invece che con i glutei.' },
              { id: 'p1-m-4', block: 'Supporto & Core', tier: 'full', animKey: 'dead_bug', name: 'Dead Bug controllato (addome profondo)', type: 'reps', value: 12, sets60: 4, sets30: 2, sets15: 2, rest60: 55, muscle: 'Core Sicuro', prop: 'Asciugamano a terra', cue: 'Schiena incollata al pavimento, distendi lentamente braccio e gamba opposti.', mistake: 'Inarcare la lombare.' },
              { id: 'p1-m-5', block: 'Brucia-Grassi', tier: 'core', animKey: 'mountain_climber', name: 'Mountain Climber su piano rialzato', type: 'time', value: 40, sets60: 4, sets30: 3, sets15: 2, rest60: 45, muscle: 'Cardio & Addome', prop: 'Tavolo o sedia stabile', cue: 'Mani salde sul tavolo, porta un ginocchio alla volta al petto a ritmo costante.', mistake: 'Rimbalzare con il bacino.' },
              { id: 'p1-m-6', block: 'Brucia-Grassi', tier: 'core', animKey: 'jumping_jack', name: 'Jumping Jack soft (ritmo continuo)', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Brucia-calorie', prop: 'Nessuno', cue: 'Apri lateralmente un piede alla volta (o saltella leggero) con braccia in alto.', mistake: 'Atterrare rigido sui talloni.' },
              { id: 'p1-m-7', block: 'Brucia-Grassi', tier: 'full', animKey: 'squat_press', name: 'Squat + Spinta braccia in alto', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 40, muscle: 'Total Body', prop: 'Nessuno', cue: 'Movimento fluido che coinvolge tutto il corpo per bruciare il massimo.', mistake: 'Curvare la schiena.' },
              { id: 'p1-m-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'shadow_boxing', name: 'Shadow Boxing defaticante leggero', type: 'time', value: 45, sets60: 3, sets30: 2, sets15: 2, rest60: 30, muscle: 'Cardio & Coordinazione', prop: 'Nessuno', cue: 'Colpi sciolti e leggeri per tenere il battito attivo senza affaticare le braccia.', mistake: 'Irrigidire le spalle.' },
              { id: 'p1-m-9', block: 'Defaticamento', tier: 'full', animKey: 'wall_angels', name: 'Defaticamento: Mobilità schiena & petto al muro', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Postura', prop: 'Muro', cue: 'Respirazioni lente e profonde mentre apri torace e spalle.', mistake: 'Trattenere il respiro.' }
            ]
          },
          {
            key: 'p1-mer', dayShort: 'Mer', dayFull: 'Mercoledì', jsDay: 3,
            focus: 'Upper Schiena, Spalle, Braccia & Postura', tag: 'Forza Upper', kcalFactor: 5.7,
            summary: '1 ora completa dedicata a schiena forte, dorsali, bicipiti e postura aperta, con blocco metabolico finale.',
            exercises: [
              { id: 'wu-3a', block: 'Riscaldamento', tier: 'core', animKey: 'warmup_shoulders', name: 'Rotazioni spalle & attivazione scapole', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Avvicina e allontana le scapole con controllo per svegliare la schiena.', mistake: 'Alzare le spalle alle orecchie.' },
              { id: 'wu-3b', block: 'Riscaldamento', tier: 'full', animKey: 'high_knees', name: 'Marcia dinamica + oscillazione braccia', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Cardio Base', prop: 'Nessuno', cue: 'Attiva circolazione e core.', mistake: 'Busto curvo in avanti.' },
              { id: 'p1-me-1', block: 'Forza Upper', tier: 'core', track: 'pull', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Dorsali & Bicipiti', mistake: 'Tirare solo di braccia senza chiudere le scapole.' },
              { id: 'p1-me-2', block: 'Forza Upper', tier: 'core', animKey: 'superman_pull', name: 'Superman Pulls a terra (tirata prona a W)', type: 'reps', value: 12, sets60: 4, sets30: 3, sets15: 2, rest60: 70, muscle: 'Schiena Alta & Lombari', prop: 'Asciugamano a terra', cue: 'Solleva leggermente il petto e tira i gomiti ai fianchi formando una W, pausa 1s.', mistake: 'Alzare il mento: guarda sempre il pavimento.' },
              { id: 'p1-me-3', block: 'Forza Upper', tier: 'med', animKey: 'towel_curl', name: 'Towel Curl Isometrico (bicipiti con asciugamano)', type: 'time', value: 30, sets60: 4, sets30: 3, sets15: 2, rest60: 65, muscle: 'Bicipiti', prop: 'Asciugamano arrotolato', cue: 'Passa l\'asciugamano sotto la coscia sollevata e tira in alto con forza (alterna lato).', mistake: 'Dondolare con la schiena.' },
              { id: 'p1-me-4', block: 'Forza Upper', tier: 'core', animKey: 'wall_angels', name: 'Wall Angels (postura & spalle sane)', type: 'reps', value: 12, sets60: 4, sets30: 3, sets15: 2, rest60: 55, muscle: 'Postura & Trapezio', prop: 'Muro', cue: 'Schiena e nuca contro il muro, fai scivolare le braccia da W a Y lentamente.', mistake: 'Staccare la bassa schiena dal muro.' },
              { id: 'p1-me-5', block: 'Supporto & Core', tier: 'med', animKey: 'shoulder_taps', name: 'Plank Shoulder Taps (stabilità spalle)', type: 'time', value: 35, sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Spalle & Core', prop: 'Tavolo o pavimento', cue: 'Tocca la spalla opposta senza muovere i fianchi.', mistake: 'Ruotare il bacino.' },
              { id: 'p1-me-6', block: 'Supporto & Core', tier: 'full', animKey: 'inchworm', name: 'Inchworm (camminata sulle mani)', type: 'reps', value: 6, sets60: 3, sets30: 2, sets15: 2, rest60: 65, muscle: 'Spalle, Core & Mobilità', prop: 'Pavimento', cue: 'Cammina avanti fino al plank completo, tieni 2 secondi e torna su.', mistake: 'Lasciare cadere il bacino.' },
              { id: 'p1-me-7', block: 'Brucia-Grassi', tier: 'core', animKey: 'shadow_boxing', name: 'Shadow Boxing (Jab-Cross rapido)', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Cardio & Resistenza Upper', prop: 'Nessuno', cue: 'Mantieni la guardia alta, colpi fluidi e continui.', mistake: 'Abbassare le mani.' },
              { id: 'p1-me-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'high_knees', name: 'Marcia ginocchia alte a ritmo sostenuto', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Brucia-calorie', prop: 'Nessuno', cue: 'Spingi bene con braccia e ginocchia per massimizzare il consumo.', mistake: 'Inclinarti indietro.' },
              { id: 'p1-me-9', block: 'Defaticamento', tier: 'full', animKey: 'glute_bridge', name: 'Defaticamento: Ponte Glutei lento & scarico schiena', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Recupero Schiena', prop: 'Asciugamano a terra', cue: 'Movimenti lenti e respirazione diaframmatica per sciogliere la schiena.', mistake: 'Eseguire di fretta.' }
            ]
          },
          {
            key: 'p1-gio', dayShort: 'Gio', dayFull: 'Giovedì', jsDay: 4,
            focus: 'Circuito Metabolico Total Body & Core', tag: 'Dimagrimento', kcalFactor: 6.8,
            summary: '1 ora brucia-grassi total body: alterniamo circuiti cardio low-impact, gambe e core profondo per accelerare il dimagrimento.',
            exercises: [
              { id: 'wu-4a', block: 'Riscaldamento', tier: 'core', animKey: 'high_knees', name: 'Marcia attiva e mobilità anche', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Attiva tutto il corpo gradualmente.', mistake: 'Movimenti bruschi a freddo.' },
              { id: 'wu-4b', block: 'Riscaldamento', tier: 'full', animKey: 'warmup_shoulders', name: 'Mobilità spalle e torace', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Mobilità', prop: 'Nessuno', cue: 'Prepara bene le spalle ai circuiti.', mistake: 'Spalle rigide.' },
              { id: 'p1-g-1', block: 'Brucia-Grassi', tier: 'core', animKey: 'squat_press', name: 'Squat + Spinta braccia in alto', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 45, muscle: 'Total Body', prop: 'Nessuno', cue: 'Risali dallo squat spingendo le braccia in alto a ritmo costante.', mistake: 'Curvare la schiena in discesa.' },
              { id: 'p1-g-2', block: 'Supporto & Core', tier: 'core', animKey: 'inchworm', name: 'Inchworm (camminata sulle mani)', type: 'reps', value: 7, sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Spalle, Core & Mobilità', prop: 'Pavimento', cue: 'Cammina sulle mani fino al plank e torna in piedi con controllo.', mistake: 'Cedimento lombare in plank.' },
              { id: 'p1-g-3', block: 'Brucia-Grassi', tier: 'core', animKey: 'shadow_boxing', name: 'Combinazione Shadow Boxing (Jab-Cross)', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Cardio & Spalle', prop: 'Nessuno', cue: 'Ruota leggermente il busto ad ogni pugno, guardia alta.', mistake: 'Abbassare le mani.' },
              { id: 'p1-g-4', block: 'Forza Gambe', tier: 'full', animKey: 'lunge', name: 'Affondi indietro alternati fluidi', type: 'reps', value: 12, sets60: 4, sets30: 2, sets15: 2, rest60: 65, muscle: 'Gambe & Glutei', prop: 'Nessuno', cue: '6 per gamba a ritmo regolare.', mistake: 'Ginocchio instabile.' },
              { id: 'p1-g-5', block: 'Brucia-Grassi', tier: 'med', animKey: 'mountain_climber', name: 'Mountain Climber su tavolo o terra', type: 'time', value: 40, sets60: 4, sets30: 3, sets15: 2, rest60: 45, muscle: 'Cardio & Core', prop: 'Tavolo o pavimento', cue: 'Spingi via il supporto con le braccia, ginocchia veloci ma controllate.', mistake: 'Bacino troppo alto.' },
              { id: 'p1-g-6', block: 'Supporto & Core', tier: 'core', animKey: 'dead_bug', name: 'Dead Bug (addome profondo)', type: 'reps', value: 12, sets60: 4, sets30: 3, sets15: 2, rest60: 55, muscle: 'Core', prop: 'Asciugamano a terra', cue: 'Schiena incollata a terra, distendi lentamente braccio e gamba opposti.', mistake: 'Staccare la schiena da terra.' },
              { id: 'p1-g-7', block: 'Supporto & Core', tier: 'full', track: 'core', sets60: 3, sets30: 2, sets15: 2, rest60: 55, muscle: 'Tenuta Core', mistake: 'Trattenere il respiro.' },
              { id: 'p1-g-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'jumping_jack', name: 'Jumping Jack soft + Marcia veloce', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Brucia-calorie Finale', prop: 'Nessuno', cue: 'Ultimo blocco aerobico per bruciare al massimo!', mistake: 'Atterraggio pesante.' },
              { id: 'p1-g-9', block: 'Defaticamento', tier: 'full', animKey: 'warmup_shoulders', name: 'Defaticamento & respirazione lenta', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Recupero', prop: 'Nessuno', cue: 'Sciogli braccia, spalle e respiro.', mistake: 'Saltare lo scarico finale.' }
            ]
          },
          {
            key: 'p1-ven', dayShort: 'Ven', dayFull: 'Venerdì', jsDay: 5,
            focus: 'Upper Completo (Spinta + Tirata) & Finisher', tag: 'Upper + Cardio', kcalFactor: 6.1,
            summary: 'Chiusura settimana da 1 ora: uniamo tutti i pilastri della parte superiore (petto, schiena, spalle, braccia, core) + blocco brucia-grassi.',
            exercises: [
              { id: 'wu-5a', block: 'Riscaldamento', tier: 'core', animKey: 'warmup_shoulders', name: 'Rotazioni spalle, polsi & aperture petto', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Prepara tutta la parte superiore con movimenti ampi.', mistake: 'Fretta nei movimenti.' },
              { id: 'wu-5b', block: 'Riscaldamento', tier: 'full', animKey: 'high_knees', name: 'Marcia veloce di attivazione', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Attivazione', prop: 'Nessuno', cue: 'Alza leggermente il battito prima della forza.', mistake: 'Restare rigido.' },
              { id: 'p1-v-1', block: 'Forza Upper', tier: 'core', track: 'push', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Petto & Spinta', mistake: 'Perdere allineamento del corpo.' },
              { id: 'p1-v-2', block: 'Forza Upper', tier: 'core', track: 'pull', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Schiena & Tirata', mistake: 'Non chiudere le scapole a fine tirata.' },
              { id: 'p1-v-3', block: 'Forza Upper', tier: 'med', animKey: 'chair_dip', name: 'Dip su sedia + Pausa 1s in basso', type: 'reps', value: 10, sets60: 4, sets30: 3, sets15: 2, rest60: 70, muscle: 'Tricipiti', prop: 'Sedia contro il muro', cue: 'Controlla la discesa e spingi via con decisione.', mistake: 'Allontanare il bacino dalla sedia.' },
              { id: 'p1-v-4', block: 'Forza Upper', tier: 'full', animKey: 'towel_curl', name: 'Towel Curl Isometrico (bicipiti)', type: 'time', value: 30, sets60: 3, sets30: 2, sets15: 2, rest60: 60, muscle: 'Bicipiti', prop: 'Asciugamano', cue: 'Tira con forza tenendo i gomiti vicino ai fianchi.', mistake: 'Alzare le spalle.' },
              { id: 'p1-v-5', block: 'Supporto & Core', tier: 'core', track: 'core', sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Core', mistake: 'Perdere tensione addominale.' },
              { id: 'p1-v-6', block: 'Supporto & Core', tier: 'full', animKey: 'superman_pull', name: 'Superman Pulls a terra (postura schiena)', type: 'reps', value: 10, sets60: 3, sets30: 2, sets15: 2, rest60: 60, muscle: 'Schiena Alta', prop: 'Asciugamano a terra', cue: 'Gomiti a W, scapole strette.', mistake: 'Sollevare troppo il collo.' },
              { id: 'p1-v-7', block: 'Brucia-Grassi', tier: 'core', animKey: 'shadow_boxing', name: 'Finisher: Shadow Boxing veloce', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Brucia-calorie', prop: 'Nessuno', cue: 'Dai il massimo in questi round per chiudere la settimana!', mistake: 'Abbassare la guardia.' },
              { id: 'p1-v-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'squat_press', name: 'Finisher 2: Squat + Spinta braccia', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Total Body', prop: 'Nessuno', cue: 'Ritmo costante e pulito fino alla fine.', mistake: 'Ginocchia verso l\'interno.' },
              { id: 'p1-v-9', block: 'Defaticamento', tier: 'full', animKey: 'wall_angels', name: 'Defaticamento: Wall Angels & respirazione', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Postura & Recupero', prop: 'Muro', cue: 'Sciogli tutto l\'upper body dopo l\'ora completa.', mistake: 'Fretta.' }
            ]
          }
        ];

        const phase2Raw = [
          {
            key: 'p2-lun', dayShort: 'Lun', dayFull: 'Lunedì', jsDay: 1,
            focus: 'Forza Upper Spinta + Circuito Brucia-Grassi', tag: 'Upper + Cardio', kcalFactor: 6.2,
            summary: 'Sessione da 1 ora del regime Lun/Mer/Ven: spinta upper body completa, richiamo gambe/core e circuito metabolico intenso.',
            exercises: [
              { id: 'wu-p2-1a', block: 'Riscaldamento', tier: 'core', animKey: 'warmup_shoulders', name: 'Riscaldamento articolare spalle & polsi', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Rotazioni ampie e aperture petto.', mistake: 'Iniziare a freddo.' },
              { id: 'wu-p2-1b', block: 'Riscaldamento', tier: 'full', animKey: 'high_knees', name: 'Marcia attiva di attivazione', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Attivazione', prop: 'Nessuno', cue: 'Prepara cuore e gambe.', mistake: 'Busto rigido.' },
              { id: 'p2-l-1', block: 'Forza Upper', tier: 'core', track: 'push', sets60: 4, sets30: 3, sets15: 2, rest60: 90, muscle: 'Petto & Tricipiti', mistake: 'Gomiti troppo larghi.' },
              { id: 'p2-l-2', block: 'Forza Upper', tier: 'core', track: 'shoulders', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Spalle', mistake: 'Inarcare la schiena.' },
              { id: 'p2-l-3', block: 'Forza Upper', tier: 'med', animKey: 'chair_dip', name: 'Dip su sedia (gambe più distese)', type: 'reps', value: 12, sets60: 4, sets30: 3, sets15: 2, rest60: 75, muscle: 'Tricipiti', prop: 'Sedia contro il muro', cue: 'Sposta i piedi 10 cm più avanti per aumentare lo stimolo.', mistake: 'Spalle incassate.' },
              { id: 'p2-l-4', block: 'Forza Upper', tier: 'full', animKey: 'shoulder_taps', name: 'Plank Shoulder Taps controllati', type: 'time', value: 40, sets60: 3, sets30: 2, sets15: 2, rest60: 60, muscle: 'Spalle & Core', prop: 'Pavimento o tavolo', cue: 'Fianchi fermissimi ad ogni tocco.', mistake: 'Oscillare.' },
              { id: 'p2-l-5', block: 'Supporto & Core', tier: 'core', track: 'core', sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Core', mistake: 'Respiro bloccato.' },
              { id: 'p2-l-6', block: 'Supporto & Core', tier: 'full', animKey: 'squat', name: 'Squat profondi controllati', type: 'reps', value: 15, sets60: 4, sets30: 2, sets15: 2, rest60: 60, muscle: 'Gambe & Metabolismo', prop: 'Nessuno', cue: 'Discesa lenta 2s, spinta decisa sui talloni.', mistake: 'Talloni sollevati.' },
              { id: 'p2-l-7', block: 'Brucia-Grassi', tier: 'core', animKey: 'squat_press', name: 'Circuito 1: Squat + Spinta braccia', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Metabolico', prop: 'Nessuno', cue: 'Ritmo sostenuto e respiro coordinato.', mistake: 'Curvare la schiena.' },
              { id: 'p2-l-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'shadow_boxing', name: 'Circuito 2: Shadow Boxing ad alta frequenza', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Cardio Upper', prop: 'Nessuno', cue: 'Pugni rapidi e guardia sempre alta.', mistake: 'Rallentare troppo.' },
              { id: 'p2-l-9', block: 'Defaticamento', tier: 'full', animKey: 'wall_angels', name: 'Defaticamento: Wall Angels & respiro', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Postura', prop: 'Muro', cue: 'Apri il torace e sciogli le spalle.', mistake: 'Saltare il recupero.' }
            ]
          },
          {
            key: 'p2-mer', dayShort: 'Mer', dayFull: 'Mercoledì', jsDay: 3,
            focus: 'Upper Schiena, Braccia & Gambe Metaboliche', tag: 'Tirata + Gambe', kcalFactor: 6.3,
            summary: '1 ora focalizzata su dorsali, bicipiti e postura affiancati a gambe e cardio ad alto dispendio energetico.',
            exercises: [
              { id: 'wu-p2-2a', block: 'Riscaldamento', tier: 'core', animKey: 'warmup_shoulders', name: 'Mobilità scapole e spalle', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Cerchi ampi e chiusura scapole.', mistake: 'Movimenti frettolosi.' },
              { id: 'wu-p2-2b', block: 'Riscaldamento', tier: 'full', animKey: 'high_knees', name: 'Marcia veloce attivazione gambe', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Attivazione', prop: 'Nessuno', cue: 'Scalda bene gambe e fiato.', mistake: 'Partire rigidi.' },
              { id: 'p2-m-1', block: 'Forza Upper', tier: 'core', track: 'pull', sets60: 4, sets30: 3, sets15: 2, rest60: 90, muscle: 'Schiena & Bicipiti', mistake: 'Non completare la chiusura scapolare.' },
              { id: 'p2-m-2', block: 'Forza Upper', tier: 'core', animKey: 'superman_pull', name: 'Superman Pulls con pausa 2s', type: 'reps', value: 12, sets60: 4, sets30: 3, sets15: 2, rest60: 70, muscle: 'Dorsali & Postura', prop: 'Asciugamano a terra', cue: 'Tira i gomiti ai fianchi e mantieni 2 secondi pieni.', mistake: 'Sollevare il mento.' },
              { id: 'p2-m-3', block: 'Forza Upper', tier: 'med', animKey: 'towel_curl', name: 'Towel Curl Isometrico (bicipiti)', type: 'time', value: 30, sets60: 4, sets30: 3, sets15: 2, rest60: 65, muscle: 'Bicipiti', prop: 'Asciugamano', cue: '15s destro + 15s sinistro con tensione controllata.', mistake: 'Tensione sul collo.' },
              { id: 'p2-m-4', block: 'Forza Upper', tier: 'full', animKey: 'wall_angels', name: 'Wall Angels (postura forte)', type: 'reps', value: 12, sets60: 3, sets30: 2, sets15: 2, rest60: 55, muscle: 'Trapezio & Spalle', prop: 'Muro', cue: 'Schiena e dorso mani sempre a contatto del muro.', mistake: 'Staccare i lombari.' },
              { id: 'p2-m-5', block: 'Supporto & Core', tier: 'med', animKey: 'lunge', name: 'Affondi indietro alternati', type: 'reps', value: 14, sets60: 4, sets30: 3, sets15: 2, rest60: 65, muscle: 'Gambe & Consumo', prop: 'Nessuno', cue: '7 per gamba, ritmo continuo.', mistake: 'Ginocchio anteriore instabile.' },
              { id: 'p2-m-6', block: 'Supporto & Core', tier: 'full', animKey: 'dead_bug', name: 'Dead Bug lento (core profondo)', type: 'reps', value: 12, sets60: 4, sets30: 2, sets15: 2, rest60: 55, muscle: 'Core', prop: 'Asciugamano a terra', cue: 'Controlla ogni centimetro con la lombare aderente.', mistake: 'Inarcare la schiena.' },
              { id: 'p2-m-7', block: 'Brucia-Grassi', tier: 'core', animKey: 'mountain_climber', name: 'Mountain Climber controllati', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 40, muscle: 'Core & Brucia-grassi', prop: 'Tavolo o pavimento', cue: 'Spingi via il supporto con le braccia, ritmo continuo.', mistake: 'Bacino troppo alto.' },
              { id: 'p2-m-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'jumping_jack', name: 'Jumping Jack soft continuo', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Cardio Dimagrimento', prop: 'Nessuno', cue: 'Mantieni un passo costante per tutti i 45s.', mistake: 'Fermarsi prima del timer.' },
              { id: 'p2-m-9', block: 'Defaticamento', tier: 'full', animKey: 'glute_bridge', name: 'Defaticamento: Ponte Glutei & scarico lombare', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Recupero', prop: 'Asciugamano a terra', cue: 'Allenta la schiena con movimenti lenti.', mistake: 'Fretta.' }
            ]
          },
          {
            key: 'p2-ven', dayShort: 'Ven', dayFull: 'Venerdì', jsDay: 5,
            focus: 'Upper Full Strength + Finisher Total Body', tag: 'Upper Completo', kcalFactor: 6.5,
            summary: 'Sessione regina da 1 ora di fine settimana: tutti i movimenti chiave della parte superiore + doppio blocco brucia-calorie.',
            exercises: [
              { id: 'wu-p2-3a', block: 'Riscaldamento', tier: 'core', animKey: 'warmup_shoulders', name: 'Mobilità globale spalle & polsi', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Riscaldamento', prop: 'Nessuno', cue: 'Attiva bene tutte le articolazioni upper body.', mistake: 'Saltare i polsi.' },
              { id: 'wu-p2-3b', block: 'Riscaldamento', tier: 'full', animKey: 'high_knees', name: 'Marcia di attivazione', type: 'time', value: 45, sets60: 2, sets30: 1, sets15: 1, rest60: 20, muscle: 'Cardio Base', prop: 'Nessuno', cue: 'Alza la frequenza cardiaca dolcemente.', mistake: 'Partire a strappi.' },
              { id: 'p2-v-1', block: 'Forza Upper', tier: 'core', track: 'push', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Petto & Tricipiti', mistake: 'Discesa troppo rapida.' },
              { id: 'p2-v-2', block: 'Forza Upper', tier: 'core', track: 'pull', sets60: 4, sets30: 3, sets15: 2, rest60: 85, muscle: 'Schiena & Bicipiti', mistake: 'Busto molle.' },
              { id: 'p2-v-3', block: 'Forza Upper', tier: 'med', track: 'shoulders', sets60: 4, sets30: 3, sets15: 2, rest60: 80, muscle: 'Spalle', mistake: 'Gomiti troppo larghi.' },
              { id: 'p2-v-4', block: 'Forza Upper', tier: 'full', animKey: 'chair_dip', name: 'Dip su sedia (tricipiti)', type: 'reps', value: 10, sets60: 3, sets30: 2, sets15: 2, rest60: 70, muscle: 'Tricipiti', prop: 'Sedia contro il muro', cue: 'Discesa controllata a 90° e spinta decisa.', mistake: 'Spalle chiuse in avanti.' },
              { id: 'p2-v-5', block: 'Supporto & Core', tier: 'med', animKey: 'inchworm', name: 'Inchworm + Plank 5s', type: 'reps', value: 7, sets60: 4, sets30: 3, sets15: 2, rest60: 60, muscle: 'Core & Spalle', prop: 'Pavimento', cue: 'Cammina avanti in plank, tieni 5 secondi, torna su in piedi.', mistake: 'Cedere con i lombari.' },
              { id: 'p2-v-6', block: 'Supporto & Core', tier: 'full', track: 'core', sets60: 3, sets30: 2, sets15: 2, rest60: 60, muscle: 'Core Stabilità', mistake: 'Respiro bloccato.' },
              { id: 'p2-v-7', block: 'Brucia-Grassi', tier: 'core', animKey: 'jumping_jack', name: 'Finisher 1: Jumping Jack soft', type: 'time', value: 45, sets60: 4, sets30: 3, sets15: 2, rest60: 35, muscle: 'Brucia-calorie', prop: 'Nessuno', cue: 'Mantieni il ritmo fino al segnale sonoro.', mistake: 'Atterraggio rigido.' },
              { id: 'p2-v-8', block: 'Brucia-Grassi', tier: 'full', animKey: 'shadow_boxing', name: 'Finisher 2: Shadow Boxing + Marcia veloce', type: 'time', value: 45, sets60: 4, sets30: 2, sets15: 2, rest60: 35, muscle: 'Cardio & Spalle', prop: 'Nessuno', cue: 'Scarica tutta l\'energia rimanente!', mistake: 'Fermarsi prima del bip.' },
              { id: 'p2-v-9', block: 'Defaticamento', tier: 'full', animKey: 'wall_angels', name: 'Defaticamento: Wall Angels & apertura torace', type: 'time', value: 60, sets60: 2, sets30: 1, sets15: 1, rest60: 25, muscle: 'Postura & Recupero', prop: 'Muro', cue: 'Ottimo lavoro: chiudi l\'ora con respiri lenti e schiena distesa.', mistake: 'Saltare lo stretching.' }
            ]
          }
        ];

        const rawList = phase === 1 ? phase1Raw : phase2Raw;
        return rawList.map(w => adaptWorkoutForMode(w, mode));
      }

      // ──────────────────────────────────────────────────────────────
      // DINNER RECIPES & FAST IPHONE CALENDAR EXPORT (.ICS)
      // ──────────────────────────────────────────────────────────────
      const DINNER_RECIPES = [
        {
          id: 'pollo-zucchine',
          title: 'Petto di pollo al limone con zucchine grigliate e pane integrale',
          prepMin: 15, tags: ['fast', 'lowcarb'], baseKcal: 500, baseProt: 48, baseCarb: 36, baseFat: 15,
          why: 'Altissima densità proteica per recuperare l\'upper body e poche calorie vuote dopo un pranzo abbondante.',
          ingredients: [
            { name: 'Petto di pollo a fette', qty: 180, unit: 'g', scalable: true },
            { name: 'Zucchine (o verdure grigliate)', qty: 250, unit: 'g', scalable: false },
            { name: 'Pane integrale (o 2-3 gallette)', qty: 50, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Olio EVO a crudo', qty: 10, unit: 'g', scalable: true },
            { name: 'Succo di limone, origano e pizzico di sale', qty: null, unit: 'q.b.', scalable: false }
          ],
          steps: 'Cuoci il pollo in padella antiaderente ben calda 3-4 min per lato con limone e origano. Griglia le zucchine a fette e condisci a crudo con olio EVO.'
        },
        {
          id: 'uova-spinaci',
          title: 'Frittata proteica uova & albumi con spinaci e pomodorini',
          prepMin: 10, tags: ['fast', 'veg', 'lowcarb'], baseKcal: 460, baseProt: 38, baseCarb: 24, baseFat: 20,
          why: 'Pronta in 10 minuti, super saziante e ricchissima di proteine nobili per riparare i muscoli mentre dormi.',
          ingredients: [
            { name: 'Uova intere', qty: 2, unit: 'uova', scalable: false },
            { name: 'Albume liquido pastorizzato', qty: 150, unit: 'ml', scalable: true },
            { name: 'Spinaci freschi o surgelati', qty: 220, unit: 'g', scalable: false },
            { name: 'Pomodorini freschi', qty: 150, unit: 'g', scalable: false },
            { name: 'Pane di segale o integrale', qty: 40, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Olio EVO', qty: 8, unit: 'g', scalable: true }
          ],
          steps: 'Appassisci gli spinaci in padella con un filo d\'acqua, aggiungi uova e albumi sbattuti con pepe e cuoci 4-5 minuti con coperchio. Accompagna con pomodorini.'
        },
        {
          id: 'tonno-ceci-insalata',
          title: 'Insalatona proteica tonno al naturale, ceci e finocchi croccanti',
          prepMin: 7, tags: ['fast', 'nocook'], baseKcal: 510, baseProt: 42, baseCarb: 44, baseFat: 15,
          why: 'Zero fornelli, ideale quando torni tardi da lavoro/studio. Fibre dei legumi + proteine magre per sazietà lunga.',
          ingredients: [
            { name: 'Tonno al naturale sgocciolato', qty: 140, unit: 'g', scalable: true },
            { name: 'Ceci cotti ben sciacquati', qty: 130, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Insalata mista + 1 finocchio a fettine', qty: 220, unit: 'g', scalable: false },
            { name: 'Pomodorini o carote', qty: 100, unit: 'g', scalable: false },
            { name: 'Olio EVO + aceto di mele o limone', qty: 12, unit: 'g', scalable: true }
          ],
          steps: 'Unisci tutto in una ciotola capiente, schiaccia una forchettata di ceci con olio e limone per creare una salsina leggera e mescola.'
        },
        {
          id: 'merluzzo-patate-fagiolini',
          title: 'Merluzzo in padella con fagiolini e patate al vapore',
          prepMin: 18, tags: ['lowcarb'], baseKcal: 490, baseProt: 43, baseCarb: 46, baseFat: 12,
          why: 'Altissimo volume nel piatto con pochissimi grassi: perfetto per sgonfiarsi dopo un pranzo fuori casa pesante.',
          ingredients: [
            { name: 'Filetti di merluzzo (anche surgelati)', qty: 220, unit: 'g', scalable: true },
            { name: 'Patate a cubetti', qty: 180, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Fagiolini verdi', qty: 220, unit: 'g', scalable: false },
            { name: 'Olio EVO + prezzemolo e aglio', qty: 10, unit: 'g', scalable: true }
          ],
          steps: 'Cuoci patate e fagiolini al vapore (o microonde 8 min). Cuoci il merluzzo in padella con coperchio, un goccio d\'acqua, limone e prezzemolo per 8 min.'
        },
        {
          id: 'fiocchi-bresaola',
          title: 'Piatto freddo: Fiocchi di latte, bresaola, rucola e gallette',
          prepMin: 5, tags: ['fast', 'nocook', 'lowcarb'], baseKcal: 470, baseProt: 45, baseCarb: 28, baseFat: 17,
          why: 'Pronto in 5 minuti netti, caseine lente dei fiocchi di latte ottime per il recupero notturno.',
          ingredients: [
            { name: 'Fiocchi di latte magri', qty: 200, unit: 'g', scalable: true },
            { name: 'Bresaola (o fesa di tacchino arrosto)', qty: 70, unit: 'g', scalable: true },
            { name: 'Rucola e pomodorini', qty: 180, unit: 'g', scalable: false },
            { name: 'Gallette di mais o riso (oppure pane integrale)', qty: 30, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Olio EVO + limone e pepe nero', qty: 10, unit: 'g', scalable: true }
          ],
          steps: 'Disponi rucola e pomodorini sul piatto, aggiungi bresaola, fiocchi di latte, una spruzzata di limone, pepe nero e un filo d\'olio.'
        },
        {
          id: 'tacchino-curry-broccoli',
          title: 'Straccetti di tacchino al curry leggero con broccoli e riso basmati',
          prepMin: 15, tags: ['fast'], baseKcal: 530, baseProt: 46, baseCarb: 52, baseFat: 13,
          why: 'Piatto caldo, gustoso e appagante che non sembra "da dieta", perfetto nei giorni di allenamento upper body.',
          ingredients: [
            { name: 'Fesa di tacchino a straccetti', qty: 180, unit: 'g', scalable: true },
            { name: 'Riso basmati (peso a crudo)', qty: 50, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Broccoli (freschi o surgelati)', qty: 250, unit: 'g', scalable: false },
            { name: 'Yogurt greco 0% (per cremosità)', qty: 40, unit: 'g', scalable: false },
            { name: 'Olio EVO + 1 cucchiaino di curry', qty: 10, unit: 'g', scalable: true }
          ],
          steps: 'Lessa riso e broccoli. Salta il tacchino in padella con curry e a fuoco spento aggiungi lo yogurt greco per una crema leggera e proteica.'
        },
        {
          id: 'salmone-asparagi',
          title: 'Salmone alla piastra con verdure verdi al limone e crostini integrali',
          prepMin: 14, tags: ['fast', 'lowcarb'], baseKcal: 540, baseProt: 37, baseCarb: 24, baseFat: 30,
          why: 'Ricco di Omega-3 antinfiammatori che aiutano il recupero muscolare nei primi giorni di allenamento.',
          ingredients: [
            { name: 'Filetto di salmone', qty: 160, unit: 'g', scalable: true },
            { name: 'Broccoli, zucchine o asparagi', qty: 250, unit: 'g', scalable: false },
            { name: 'Pane integrale tostato', qty: 40, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Olio EVO (pochissimo: il salmone ha già grassi buoni)', qty: 5, unit: 'g', scalable: false }
          ],
          steps: 'Cuoci il salmone lato pelle in padella antiaderente 4 min, gira 3 min con succo di limone. Accompagna con verdure verdi e pane tostato.'
        },
        {
          id: 'yogurt-ricotta-uova-veg',
          title: 'Bowl salata vegetariana: Lenticchie, ricotta magra, uovo sodo e verdure',
          prepMin: 12, tags: ['fast', 'veg'], baseKcal: 500, baseProt: 34, baseCarb: 48, baseFat: 16,
          why: 'Alternativa vegetariana completa di aminoacidi, molto saziante e facilissima da preparare anche in anticipo.',
          ingredients: [
            { name: 'Lenticchie cotte sciacquate', qty: 160, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Ricotta vaccina leggera (o fiocchi di latte)', qty: 100, unit: 'g', scalable: true },
            { name: 'Uovo sodo', qty: 1, unit: 'uovo', scalable: false },
            { name: 'Insalata croccante, cetrioli e pomodorini', qty: 220, unit: 'g', scalable: false },
            { name: 'Olio EVO + erbe aromatiche', qty: 10, unit: 'g', scalable: true }
          ],
          steps: 'Assembla la bowl con verdure alla base, lenticchie tiepide o fredde, ricotta a cucchiaiate e uovo sodo a spicchi.'
        },
        {
          id: 'sgombro-peperoni',
          title: 'Filetti di sgombro al naturale con peperoni arrosto e pane di segale',
          prepMin: 8, tags: ['fast', 'nocook', 'lowcarb'], baseKcal: 495, baseProt: 36, baseCarb: 32, baseFat: 22,
          why: 'Zero cottura se usi peperoni/verdure già pronte, ricco di proteine e Omega-3 a basso costo.',
          ingredients: [
            { name: 'Filetti di sgombro al naturale', qty: 150, unit: 'g', scalable: true },
            { name: 'Peperoni arrostiti o insalata mista', qty: 220, unit: 'g', scalable: false },
            { name: 'Pane di segale o integrale', qty: 55, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Olio EVO + prezzemolo e limone', qty: 8, unit: 'g', scalable: true }
          ],
          steps: 'Condisci lo sgombro con limone e prezzemolo, abbina alle verdure e al pane leggermente tostato.'
        },
        {
          id: 'tofu-verdure-soia',
          title: 'Tofu croccante in padella con zucchine, carote e salsa di soia',
          prepMin: 15, tags: ['fast', 'veg', 'lowcarb'], baseKcal: 485, baseProt: 34, baseCarb: 34, baseFat: 21,
          why: '100% vegetale, leggero da digerire la sera e ricco di proteine vegetali.',
          ingredients: [
            { name: 'Tofu al naturale a cubetti', qty: 200, unit: 'g', scalable: true },
            { name: 'Zucchine e carote a bastoncini', qty: 260, unit: 'g', scalable: false },
            { name: 'Riso integrale o pane integrale', qty: 40, unit: 'g', scalable: true, carbFlex: true },
            { name: 'Olio EVO + 1 cucchiaio salsa di soia', qty: 10, unit: 'g', scalable: true }
          ],
          steps: 'Asciuga bene il tofu con carta da cucina, rosolalo 5 min fino a dorarlo, aggiungi le verdure e sfuma con salsa di soia negli ultimi 2 minuti.'
        }
      ];


  return {
    ANIMATIONS,
    buildAnimSvgInner,
    PROGRESSIONS,
    DINNER_RECIPES,
    getPhaseWorkouts(phase, durationMode, levels) {
      state = { training: { durationMode: durationMode || 'full60', levels: levels || { push: 1, pull: 1, shoulders: 1, core: 1 } } };
      return getPhaseWorkouts(phase);
    },
    buildExercise(ex, levels) {
      state = { training: { levels: levels || { push: 1, pull: 1, shoulders: 1, core: 1 } } };
      return buildExercise(ex);
    }
  };
})();
