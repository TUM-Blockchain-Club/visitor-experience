import { Box, Flex, Link, Separator, Text } from "@radix-ui/themes";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer aria-label="Site footer">
      <Separator size="4" className="opacity-60" />
      <Box className="px-4 py-6 md:px-6">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Text size="2" color="gray">
            © {currentYear} TUM Blockchain Club
          </Text>
          <Text size="2">
            For help and feedback, contact us at{"\u00A0"}
            <Link
              href="mailto:it@tum-blockchain.com"
              aria-label="Email it@tum-blockchain.com for inquiries and support"
            >
              it@tum-blockchain.com
            </Link>
          </Text>
        </Flex>
      </Box>
    </footer>
  );
}
