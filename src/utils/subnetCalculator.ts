export interface SubnetInfo {
  ip: string;
  cidr: number;
  netmask: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  numHosts: number;
}

export function calculateSubnet(ip: string, cidr: number): SubnetInfo | null {
  const ipParts = ip.split('.').map(Number);
  if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  const maskNum = ~((1 << (32 - cidr)) - 1);
  const networkNum = ipNum & maskNum;
  const broadcastNum = networkNum | ~maskNum;
  const numHosts = cidr >= 31 ? 0 : Math.pow(2, 32 - cidr) - 2;

  const numToIp = (num: number) => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  };

  return {
    ip,
    cidr,
    netmask: numToIp(maskNum),
    network: numToIp(networkNum),
    broadcast: numToIp(broadcastNum),
    firstHost: numHosts > 0 ? numToIp(networkNum + 1) : 'N/A',
    lastHost: numHosts > 0 ? numToIp(broadcastNum - 1) : 'N/A',
    numHosts
  };
}

export function ipToBinary(ip: string): string {
  return ip.split('.').map(octet => {
    const num = parseInt(octet, 10);
    if (isNaN(num)) return '--------';
    return num.toString(2).padStart(8, '0');
  }).join('.');
}

export function listSubnets(baseNetwork: string, baseCidr: number, newCidr: number): { name: string; network: string; broadcast: string; firstHost: string; lastHost: string; }[] {
  if (newCidr <= baseCidr || newCidr > 32 || baseCidr < 0 || baseCidr > 32) return [];
  const blockSize = Math.pow(2, 32 - newCidr);
  const numSubnets = Math.pow(2, newCidr - baseCidr);
  if (numSubnets > 256) return [];
  const baseNum = ipToNumber(baseNetwork);
  const result = [];
  for (let i = 0; i < numSubnets; i++) {
    const networkNum = baseNum + i * blockSize;
    const broadcastNum = networkNum + blockSize - 1;
    result.push({
      name: `${i+1}`,
      network: numberToIp(networkNum),
      broadcast: numberToIp(broadcastNum),
      firstHost: numberToIp(networkNum + 1),
      lastHost: numberToIp(broadcastNum - 1),
    });
  }
  return result;
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}
export function getIpClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0]);

  if (firstOctet >= 1 && firstOctet <= 126) return 'Classe A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'Classe B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'Classe C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'Classe D';
  return 'Classe E';
}

export function getIpType(ip: string): string {
  const parts = ip.split('.').map(Number);

  if (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  ) {
    return 'Privado';
  }

  return 'Público';
}