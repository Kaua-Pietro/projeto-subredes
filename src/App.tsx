import { useState, useEffect } from 'react';

import {
  calculateSubnet,
  type SubnetInfo,
  ipToBinary,
  listSubnets,
  getIpClass,
  getIpType
} from './utils/subnetCalculator';

import './App.css';

export default function App() {
  const [ip, setIp] = useState('192.168.1.0');
  const [cidr, setCidr] = useState('24');
  const [result, setResult] = useState<SubnetInfo | null>(null);
  const [showAndSteps, setShowAndSteps] = useState(false);
  const [subnetCidr, setSubnetCidr] = useState(26);
  const [showSubnetTable, setShowSubnetTable] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cidrNumber = parseInt(cidr, 10);
    if (ip && !isNaN(cidrNumber) && cidrNumber >= 0 && cidrNumber <= 32) {
      const calcResult = calculateSubnet(ip, cidrNumber);
      setResult(calcResult);
    } else {
      setResult(null);
    }
  }, [ip, cidr]);

  const getBits = () => {
    const c = parseInt(cidr, 10);
    if (isNaN(c)) return { rede: 0, host: 0 };
    return { rede: Math.min(c, 32), host: Math.max(0, 32 - Math.min(c, 32)) };
  };
  const { rede: redeBits, host: hostBits } = getBits();
  const redePercent = (redeBits / 32) * 100;
  const hostPercent = (hostBits / 32) * 100;

  const getAndSteps = () => {
    if (!result) return null;
    const ipBin = ipToBinary(result.ip);
    const maskBin = ipToBinary(result.netmask);
    const networkBin = ipToBinary(result.network);
    return { ipBin, maskBin, networkBin };
  };

  const currentCidr = parseInt(cidr, 10);
  const isCidrValid = !isNaN(currentCidr) && currentCidr >= 0 && currentCidr <= 32;

  const availableSubnetCidrs = isCidrValid && currentCidr <= 28
    ? Array.from({ length: Math.min(32 - currentCidr, 8) }, (_, i) => currentCidr + i + 1)
    : [];

  const subnetsList = result && isCidrValid && currentCidr <= 28 && subnetCidr > currentCidr && availableSubnetCidrs.includes(subnetCidr)
    ? listSubnets(result.network, currentCidr, subnetCidr)
    : [];

  const getSplitSubnets = () => {
    if (!result || !isCidrValid) return null;
    const baseCidr = currentCidr;
    const newCidr = baseCidr + 1;
    if (newCidr > 32) return null;
    const subnets = listSubnets(result.network, baseCidr, newCidr);
    if (subnets.length >= 2) {
      const first = subnets[0];
      const second = subnets[1];
      const totalHosts = Math.pow(2, 32 - baseCidr);
      const firstSize = Math.pow(2, 32 - newCidr);
      const firstEnd = totalHosts > 0 ? firstSize / totalHosts : 0.5;
      return { first, second, firstEnd };
    }
    return null;
  };
  const splitData = getSplitSubnets();

  const InfoCard = ({ label, value}: { label: string; value: string | number; icon?: string }) => (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );

  return (
    <div className={`container ${mounted ? 'mounted' : ''}`}>
      {/* Grid decorativo de fundo */}
      <div className="bg-grid" aria-hidden="true"></div>
      <div className="bg-glow" aria-hidden="true"></div>

      <header className="header">
        <div className="header-badge">
          <span className="badge-dot"></span>
          Network Tools
        </div>
        <h1>Calculadora de<br /><span className="title-accent">Sub-redes</span></h1>
        <p className="header-desc">Análise completa de endereçamento IPv4 com CIDR</p>
      </header>

      <div className="input-section">
        <div className="input-section-label">Configuração da rede</div>
        <div className="input-group">
          <div className="input-wrapper">
            <label>Endereço IP</label>
            <div className="input-field-wrap">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="Ex: 192.168.1.0" />
            </div>
          </div>
          <div className="input-wrapper">
            <label>Prefixo CIDR</label>
            <div className="input-field-wrap cidr-wrap">
              <span className="cidr-slash">/</span>
              <input type="number" value={cidr} onChange={(e) => setCidr(e.target.value)} min="0" max="32" className="cidr-input" />
              <div className="cidr-range">
                <input type="range" min="0" max="32" value={isCidrValid ? currentCidr : 0}
                  onChange={(e) => setCidr(e.target.value)} className="cidr-slider" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <div className="results-wrapper">

          {/* Cabeçalho do resultado */}
          <div className="result-header">
            <div className="result-network-badge">
              <span className="rn-label">Rede detectada</span>
              <span className="rn-value">{result.network}/{cidr}</span>
            </div>
            <div className="result-pills">
              <span className="pill pill-class">{getIpClass(result.ip)}</span>
              <span className={`pill ${getIpType(result.ip) === 'Privado' ? 'pill-private' : 'pill-public'}`}>
                {getIpType(result.ip)}
              </span>
            </div>
          </div>

          {/* Cards de especificações */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">Especificações</span>
              <span className="section-line"></span>
            </div>
            <div className="cards-grid">
              <InfoCard label="Máscara de sub-rede" value={result.netmask} />
              <InfoCard label="Endereço de rede" value={result.network} />
              <InfoCard label="Broadcast" value={result.broadcast} />
              <InfoCard label="1º IP útil" value={result.firstHost} />
              <InfoCard label="Último IP útil" value={result.lastHost} />
              <InfoCard label="Hosts úteis" value={result.numHosts.toLocaleString('pt-BR')} />
            </div>
          </div>

          {/* Barra de bits */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">Divisão de bits</span>
              <span className="section-line"></span>
            </div>
            <div className="bits-section">
              <div className="bits-visual">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className={`bit-cell ${i < redeBits ? 'bit-network' : 'bit-host'}`}>
                    {(i === 0 || i === 7 || i === 8 || i === 15 || i === 16 || i === 23 || i === 24 || i === 31) && (
                      <span className="bit-index">{i === 0 ? '0' : i === 31 ? '31' : ''}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="bits-legend">
                <div className="bits-bar-row">
                  <div className="bits-bar-label">
                    <span className="dot dot-network"></span>
                    Rede
                    <span className="bits-count">{redeBits} bits</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill bar-fill-network" style={{ width: `${redePercent}%` }}></div>
                  </div>
                </div>
                <div className="bits-bar-row">
                  <div className="bits-bar-label">
                    <span className="dot dot-host"></span>
                    Host
                    <span className="bits-count">{hostBits} bits</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill bar-fill-host" style={{ width: `${hostPercent}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="bits-note">Quanto maior o CIDR, menos bits de host e mais sub-redes possíveis.</p>
            </div>
          </div>

          {/* AND passo a passo */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">Operação AND</span>
              <span className="section-line"></span>
            </div>
            <div className="and-section">
              <button className="toggle-btn" onClick={() => setShowAndSteps(!showAndSteps)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                  <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
                {showAndSteps ? 'Ocultar cálculo AND' : 'Mostrar cálculo AND passo a passo'}
                <svg className={`chevron ${showAndSteps ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {showAndSteps && (
                <div className="and-steps">
                  <div className="step-row">
                    <div className="step-tag">IP</div>
                    <code className="step-binary">{getAndSteps()?.ipBin}</code>
                  </div>
                  <div className="step-operator">AND</div>
                  <div className="step-row">
                    <div className="step-tag">MSK</div>
                    <code className="step-binary">{getAndSteps()?.maskBin}</code>
                  </div>
                  <div className="step-result-divider">
                    <span></span>
                    <span className="step-equals">=</span>
                    <span></span>
                  </div>
                  <div className="step-row result-row">
                    <div className="step-tag result-tag">NET</div>
                    <code className="step-binary step-highlight">{getAndSteps()?.networkBin}</code>
                  </div>
                  <div className="step-explanation">
                    <strong>Como funciona:</strong> Cada bit do IP é comparado com o bit da máscara.
                    O resultado é 1 apenas quando ambos são 1. Os bits de host da máscara são 0,
                    zerando a parte do host no IP e resultando no endereço da rede.
                    <br />
                    <em>Exemplo: 192.168.1.0/24 → os 24 primeiros bits (rede) permanecem, os 8 últimos (host) viram 0.</em>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabela de sub-redes */}
          {isCidrValid && currentCidr <= 28 && (
            <div className="section">
              <div className="section-header">
                <span className="section-title">Tabela de sub-redes</span>
                <span className="section-line"></span>
              </div>
              <div className="subnet-section">
                <div className="subnet-control">
                  <span className="subnet-control-label">Dividir <strong>/{currentCidr}</strong> em sub-redes</span>
                  <select value={subnetCidr} onChange={(e) => setSubnetCidr(Number(e.target.value))}>
                    {availableSubnetCidrs.map(c => (
                      <option key={c} value={c}>/{c}</option>
                    ))}
                  </select>
                  <button className="action-btn" onClick={() => setShowSubnetTable(!showSubnetTable)}>
                    {showSubnetTable ? 'Ocultar' : 'Exibir sub-redes'}
                  </button>
                </div>

                {subnetsList.length > 0 && (
                  <div className="subnet-info-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 7v6M12 16v.5"/>
                    </svg>
                    {subnetsList.length} sub-redes geradas com /{subnetCidr}
                  </div>
                )}

                {showSubnetTable && subnetsList.length > 0 && (
                  <div className="subnet-table-wrap">
                    <table className="subnet-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Rede</th>
                          <th>Broadcast</th>
                          <th>1º Host</th>
                          <th>Último Host</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subnetsList.map((sub, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'row-even' : ''}>
                            <td className="row-num">{sub.name}</td>
                            <td className="row-network">{sub.network}</td>
                            <td>{sub.broadcast}</td>
                            <td>{sub.firstHost}</td>
                            <td>{sub.lastHost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VLSM */}
          {splitData && (
            <div className="section">
              <div className="section-header">
                <span className="section-title">Quebra de rede — VLSM</span>
                <span className="section-line"></span>
              </div>
              <div className="vlsm-section">
                <div className="vlsm-labels-top">
                  <span>/{currentCidr} — rede original</span>
                  <span>/{currentCidr + 1} — duas metades</span>
                </div>
                <div className="vlsm-bar">
                  <div className="vlsm-first" style={{ width: `${splitData.firstEnd * 100}%` }}>
                    <span className="vlsm-text">{splitData.first.network}</span>
                  </div>
                  <div className="vlsm-second" style={{ width: `${(1 - splitData.firstEnd) * 100}%` }}>
                    <span className="vlsm-text">{splitData.second.network}</span>
                  </div>
                </div>
                <p className="vlsm-note">
                  Aumentar o CIDR em 1 divide a rede em duas metades iguais.
                  Cada nova sub-rede tem metade dos endereços da original.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="error-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
            <path d="M12 9v4M12 16.5v.5M10.268 3l-8.268 14.4A2 2 0 0 0 3.732 20h16.536a2 2 0 0 0 1.732-3L13.732 3a2 2 0 0 0-3.464 0z"/>
          </svg>
          Digite um endereço IP e prefixo CIDR válidos (0–32).
        </div>
      )}

      <footer className="footer">
        IPv4 · CIDR · VLSM
      </footer>
    </div>
  );
}