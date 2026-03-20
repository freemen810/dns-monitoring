import Dns2 from 'dns2';

const RECORD_TYPE_MAP = {
  'A': 1,
  'NS': 2,
  'CNAME': 5,
  'SOA': 6,
  'MX': 15,
  'TXT': 16,
  'AAAA': 28,
  'SRV': 33,
  'PTR': 12,
};

/**
 * Convert answer records to canonical strings based on record type
 */
function canonicalizeAnswers(answers, recordType) {
  if (!answers || answers.length === 0) {
    return [];
  }

  return answers.map((answer) => {
    switch (recordType.toUpperCase()) {
      case 'A':
      case 'AAAA':
        return answer.address;
      case 'CNAME':
        return answer.cname;
      case 'MX':
        return `${answer.priority} ${answer.exchange}`;
      case 'NS':
        return answer.ns;
      case 'TXT':
        return Array.isArray(answer.txt) ? answer.txt.join('') : answer.txt;
      case 'SRV':
        return `${answer.priority} ${answer.weight} ${answer.port} ${answer.target}`;
      case 'SOA':
        return `${answer.mname} ${answer.rname} ${answer.serial} ${answer.refresh} ${answer.retry} ${answer.expire} ${answer.minimum}`;
      case 'PTR':
        return answer.ptr;
      default:
        return JSON.stringify(answer);
    }
  }).sort();
}

/**
 * Query a specific DNS server directly
 */
export async function query(domain, recordType, server, port = 53, timeoutMs = 5000) {
  const dns = new Dns2({
    nameServers: [server],
    port,
  });

  return Promise.race([
    (async () => {
      try {
        const response = await dns.resolve(domain, recordType);

        const answers = response.answers || [];
        const records = canonicalizeAnswers(answers, recordType);

        return {
          status: 'ok',
          records,
          response: response,
        };
      } catch (error) {
        return {
          status: 'fail',
          records: [],
          error: error.message,
        };
      }
    })(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS query timeout')), timeoutMs)
    ),
  ]).catch((error) => {
    return {
      status: 'timeout',
      records: [],
      error: error.message,
    };
  });
}
