
const ldap = require('ldapjs');

async function ldapLogin(username, password) {
  const client = ldap.createClient({
    url: 'ldap://your_ldap_server',
  });

  try {
    const user = await client.bind(username, password);
    client.unbind();
    return user;
  } catch (error) {
    return null;
  }
}


module.exports = ldapLogin;
