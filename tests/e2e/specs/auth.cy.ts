describe('VaultPOS authentication', () => {
  it('opens the login screen', () => {
    cy.visit('/')
    cy.contains('h1', 'Entrar na sua conta', { timeout: 7000 })
    cy.contains('button', 'Continuar com Google')
    cy.contains('button', 'Cadastre-se')
  })
})
